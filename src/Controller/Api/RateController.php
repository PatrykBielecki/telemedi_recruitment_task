<?php
namespace App\Controller\Api;

use App\Domain\Currency;
use App\Service\ExchangeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class RateController
{
    public function __construct(private ExchangeService $svc) {}

    public function rates(Request $req): JsonResponse
    {
        try {
            $dateStr = $req->query->get('date') ?: (new \DateTime('today'))->format('Y-m-d');
            $date = \DateTime::createFromFormat('Y-m-d', $dateStr) ?: new \DateTime('today');

            $dtos = $this->svc->getRates($date);
            $list = array_map(fn($dto) => $dto->toArray(), $dtos);

            // Effective date – weź z pierwszej pozycji; wszystkie waluty z tabeli A mają tę samą datę
            $effective = $list[0]['date'] ?? $date->format('Y-m-d');

            return new JsonResponse([
                'requestedDate' => $date->format('Y-m-d'),
                'effectiveDate' => $effective,
                'items' => $list
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'NBP jest chwilowo niedostępne. Spróbuj ponownie.'], 502);
        }
    }

    public function history(string $code, Request $req): JsonResponse
    {
        $code = strtoupper($code);
        if (!in_array($code, Currency::SUPPORTED, true)) {
            return new JsonResponse(['error'=>'Unsupported currency'], 400);
        }
        $days = max(1, (int)($req->query->get('days') ?: 14));
        $dateStr = $req->query->get('date') ?: (new \DateTime('today'))->format('Y-m-d');
        $date = \DateTime::createFromFormat('Y-m-d', $dateStr) ?: new \DateTime('today');

        $items = array_map(fn($dto) => $dto->toArray(), $this->svc->getHistory($code, $date, $days));
        return new JsonResponse(['code'=>$code,'date'=>$date->format('Y-m-d'),'days'=>$days,'items'=>$items]);
    }
}
