<?php
namespace App\Controller\Api;

use App\Domain\Currency;
use App\Service\ExchangeService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

final class RateController
{
    public function __construct(private ExchangeService $svc) {}

    #[Route('/api/rates', name: 'api_rates', methods: ['GET'])]
    public function rates(Request $req): JsonResponse
    {
        $dateStr = $req->query->get('date') ?: (new \DateTime('today'))->format('Y-m-d');
        $date = \DateTime::createFromFormat('Y-m-d', $dateStr) ?: new \DateTime('today');
        $list = array_map(fn($dto) => $dto->toArray(), $this->svc->getRates($date));
        return new JsonResponse(['date'=>$date->format('Y-m-d'), 'items'=>$list]);
    }

    #[Route('/api/rates/{code}/history', name: 'api_rates_history', methods: ['GET'])]
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
