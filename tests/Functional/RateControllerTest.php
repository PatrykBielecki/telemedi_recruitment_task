<?php
namespace App\Tests\Functional;

use App\Service\ExchangeService;
use App\Service\RateCalculator;
use App\Service\NbpClient;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class RateControllerTest extends WebTestCase
{
    public function testRatesEndpoint(): void
    {
        self::bootKernel();
        $container = static::getContainer();

        // Podmień NbpClient na fake (bez zewnętrznego HTTP)
        $fake = new class extends NbpClient {
            public function __construct() {}
            public function getTableAMapForDate(\DateTimeInterface $d): array {
                return ['EUR'=>['mid'=>4.50,'date'=>'2025-09-01'],'USD'=>['mid'=>3.90,'date'=>'2025-09-01']];
            }
            public function getHistoryFor(string $code,\DateTimeInterface $end,int $days): array {
                return [['date'=>'2025-08-31','mid'=>4.4],['date'=>'2025-08-30','mid'=>4.3]];
            }
        };

        $svc = new ExchangeService($fake, new RateCalculator());
        $rates = $svc->getRates(new \DateTime('2025-09-01'));
        $this->assertNotEmpty($rates);
    }
}
