<?php
namespace App\Dto;

final class RateDto
{
    public function __construct(
        public string $code,          // EUR/...
        public string $date,          // Y-m-d
        public float $mid,            // kurs średni NBP
        public ?float $buy,           // kurs kupna kantoru (nullable)
        public ?float $sell           // kurs sprzedaży kantoru
    ) {}
    public function toArray(): array {
        return [
            'code'=>$this->code,'date'=>$this->date,
            'mid'=>$this->mid,'buy'=>$this->buy,'sell'=>$this->sell
        ];
    }
}
