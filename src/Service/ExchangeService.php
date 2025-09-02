<?php
namespace App\Service;

use App\Domain\Currency;
use App\Dto\RateDto;

final class ExchangeService
{
    public function __construct(
        private NbpClient $nbp,
        private RateCalculator $calc
    ) {}

    /** Zwraca listę RateDto dla obsługiwanych walut na daną datę */
    public function getRates(\DateTimeInterface $date): array
    {
        $map = $this->nbp->getTableAMapForDate($date);
        $out = [];
        foreach (Currency::SUPPORTED as $code) {
            if (!isset($map[$code])) continue;
            $m = $map[$code];
            $c = $this->calc->compute($code, $m['mid']);
            $out[] = new RateDto($code, $m['date'], $m['mid'], $c['buy'], $c['sell']);
        }
        return $out;
    }

    /** Zwraca historię N dni PRZED datą, jako [RateDto ...] */
    public function getHistory(string $code, \DateTimeInterface $date, int $days): array
    {
        $hist = $this->nbp->getHistoryFor($code, $date, $days);
        $out = [];
        foreach ($hist as $row) {
            $c = $this->calc->compute($code, $row['mid']);
            $out[] = new RateDto(strtoupper($code), $row['date'], $row['mid'], $c['buy'], $c['sell']);
        }
        return $out;
    }
}
