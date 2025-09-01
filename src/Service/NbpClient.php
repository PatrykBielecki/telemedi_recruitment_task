<?php
namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

final class NbpClient
{
    public function __construct(
        private HttpClientInterface $http,
        private CacheInterface $cache
    ) {}

    /**
     * Zwraca mapę [code => ['mid'=>float,'date'=>Y-m-d]] dla danej daty
     * Jeśli wybrany dzień nie ma notowania (weekend/święto), próbujemy cofać się wstecz
     */
    public function getTableAMapForDate(\DateTimeInterface $date): array
    {
        $probe = clone $date;
        for ($i=0; $i<7; $i++) {
            $key = 'nbp:tableA:'.$probe->format('Y-m-d');
            $data = $this->cache->get($key, function(ItemInterface $item) use ($probe) {
                $isToday = $probe->format('Y-m-d') === (new \DateTime('today'))->format('Y-m-d');
                $item->expiresAfter($isToday ? 600 : 86400 * 30);

                $url = sprintf('https://api.nbp.pl/api/exchangerates/tables/A/%s/?format=json', $probe->format('Y-m-d'));
                $resp = $this->http->request('GET', $url);
                if ($resp->getStatusCode() !== 200) {
                    // Brak tabeli (404)
                    throw new \RuntimeException('No table for date');
                }
                $json = $resp->toArray();
                if (!isset($json[0]['effectiveDate'], $json[0]['rates'])) {
                    throw new \RuntimeException('Malformed response');
                }
                $effective = $json[0]['effectiveDate'];
                $out = [];
                foreach ($json[0]['rates'] as $r) {
                    $out[$r['code']] = ['mid'=>(float)$r['mid'], 'date'=>$effective];
                }
                return $out;
            });

            if ($data) return $data;
            $probe->modify('-1 day');
        }
        throw new \RuntimeException('No NBP table found in last 7 days');
    }

    /**
     * Zwraca listę [ ['date'=>Y-m-d,'mid'=>float], ... ] dla zakresu NBP pomija weekendy
     * endDate jest WYŁĄCZONY tylko "ostatnie N dni PRZED datą"
     */
    public function getHistoryFor(string $code, \DateTimeInterface $endDate, int $days): array
    {
        $end = (clone $endDate)->modify('-1 day');
        $start = (clone $end)->modify(sprintf('-%d days', $days-1));
        $key = sprintf('nbp:hist:A:%s:%s:%s', strtoupper($code), $start->format('Y-m-d'), $end->format('Y-m-d'));

        return $this->cache->get($key, function(ItemInterface $item) use ($code,$start,$end) {
            $item->expiresAfter(86400 * 30);
            $url = sprintf('https://api.nbp.pl/api/exchangerates/rates/A/%s/%s/%s/?format=json',
                strtoupper($code), $start->format('Y-m-d'), $end->format('Y-m-d')
            );
            $resp = $this->http->request('GET', $url);
            if ($resp->getStatusCode() !== 200) return [];
            $json = $resp->toArray();
            $out = [];
            foreach ($json['rates'] ?? [] as $r) {
                $out[] = ['date'=>$r['effectiveDate'], 'mid'=>(float)$r['mid']];
            }
            return $out;
        });
    }
}
