<?php
namespace App\Service;

final class RateCalculator
{
    public function compute(string $code, float $mid): array
    {
        $code = strtoupper($code);
        // Zaokrąglamy do 4 miejsc
        $round = fn(float $v) => round($v, 4);

        if (in_array($code, ['EUR','USD'], true)) {
            $buy  = $round($mid - 0.15);
            $sell = $round($mid + 0.11);
            return ['buy'=>$buy, 'sell'=>$sell];
        }
        // Pozostałe: brak kupna, sprzedaż mid+0.2
        return ['buy'=>null, 'sell'=>$round($mid + 0.2)];
    }
}
