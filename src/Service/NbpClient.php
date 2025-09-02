<?php
namespace App\Service;

final class NbpClient
{
    private string $cacheDir;

    public function __construct(?string $cacheDir = null)
    {
        $this->cacheDir = $cacheDir ?: __DIR__ . '/../../var/nbp-cache';
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0775, true);
        }
    }

    private function get(string $url, int $ttl): array
    {
        $key = sha1($url);
        $file = $this->cacheDir . '/' . $key . '.json';
        if (is_file($file) && (time() - filemtime($file) < $ttl)) {
            $data = file_get_contents($file);
            return json_decode($data, true) ?? [];
        }
        $ctx = stream_context_create([
            'http' => ['timeout' => 8, 'ignore_errors' => true, 'header' => "Accept: application/json\r\n"]
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false) {
            if (is_file($file)) {
                $data = file_get_contents($file);
                return json_decode($data, true) ?? [];
            }
            throw new \RuntimeException('NBP request failed');
        }
        $arr = json_decode($raw, true);
        if (!is_array($arr)) {
            throw new \RuntimeException('Invalid JSON');
        }
        @file_put_contents($file, json_encode($arr));
        return $arr;
    }

    public function getTableAMapForDate(\DateTimeInterface $date): array
    {
        $probe = clone $date;
        for ($i=0; $i<7; $i++) {
            $url = sprintf('https://api.nbp.pl/api/exchangerates/tables/A/%s/?format=json', $probe->format('Y-m-d'));
            try {
                $json = $this->get($url, $probe->format('Y-m-d') === (new \DateTime('today'))->format('Y-m-d') ? 600 : 86400*30);
                if (!isset($json[0]['effectiveDate'], $json[0]['rates'])) {
                    throw new \RuntimeException('Malformed');
                }
                $effective = $json[0]['effectiveDate'];
                $out = [];
                foreach ($json[0]['rates'] as $r) {
                    $out[$r['code']] = ['mid'=>(float)$r['mid'], 'date'=>$effective];
                }
                return $out;
            } catch (\Throwable $e) {
                $probe->modify('-1 day'); // weekend/święto → cofnij dzień
            }
        }
        throw new \RuntimeException('No NBP table found in last 7 days');
    }

    public function getHistoryFor(string $code, \DateTimeInterface $endDate, int $days): array
    {
        $end = (clone $endDate)->modify('-1 day'); // „przed datą”
        $start = (clone $end)->modify(sprintf('-%d days', $days-1));
        $url = sprintf(
            'https://api.nbp.pl/api/exchangerates/rates/A/%s/%s/%s/?format=json',
            strtoupper($code), $start->format('Y-m-d'), $end->format('Y-m-d')
        );
        $json = $this->get($url, 86400*30);
        $out = [];
        foreach ($json['rates'] ?? [] as $r) {
            $out[] = ['date'=>$r['effectiveDate'], 'mid'=>(float)$r['mid']];
        }
        return $out;
    }
}
