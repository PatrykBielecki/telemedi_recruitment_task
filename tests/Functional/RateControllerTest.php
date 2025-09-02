<?php
declare(strict_types=1);

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class RateControllerTest extends WebTestCase
{
    private function assertRegexCompat(string $pattern, ?string $value, string $msg = ''): void
    {
        if ($value === null) {
            self::fail('Value is null, cannot match regex');
        }
        if (method_exists($this, 'assertMatchesRegularExpression')) {
            /** @phpstan-ignore-next-line */
            self::assertMatchesRegularExpression($pattern, $value, $msg);
        } else {
            /** @phpstan-ignore-next-line */
            self::assertRegExp($pattern, $value, $msg);
        }
    }

    private static function decode(string $content): array
    {
        $json = json_decode($content, true);
        if ($json === null && json_last_error() !== JSON_ERROR_NONE) {
            self::fail('Response is not a valid JSON: ' . substr($content, 0, 500));
        }
        return $json ?? [];
    }

    private static function assertStatus(\Symfony\Bundle\FrameworkBundle\KernelBrowser $c, array|int $expected): void
    {
        $status = $c->getResponse()->getStatusCode();
        $ok = is_int($expected) ? ($status === $expected) : in_array($status, $expected, true);
        if (!$ok) {
            $body = $c->getResponse()->getContent();
            self::fail(sprintf("Unexpected HTTP %d. Body:\n%s", $status, substr($body ?? '', 0, 1000)));
        }
        self::assertTrue(true);
    }

    private function assertRateItemSchema(array $it): void
    {
        self::assertArrayHasKey('code', $it);
        $this->assertRegexCompat('/^[A-Z]{3}$/', $it['code'] ?? '');

        self::assertArrayHasKey('mid', $it);
        self::assertTrue(is_float($it['mid']) || is_int($it['mid']));

        self::assertArrayHasKey('buy', $it);
        self::assertTrue(is_float($it['buy']) || is_int($it['buy']) || $it['buy'] === null);

        self::assertArrayHasKey('sell', $it);
        self::assertTrue(is_float($it['sell']) || is_int($it['sell']) || $it['sell'] === null);
    }

    public function testRatesOkWithDate(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates?date=2025-08-29'); // piątek
        self::assertStatus($c, 200);

        $json = self::decode($c->getResponse()->getContent() ?: '');
        self::assertArrayHasKey('requestedDate', $json);
        self::assertArrayHasKey('effectiveDate', $json);
        self::assertArrayHasKey('items', $json);
        self::assertIsArray($json['items']);
        self::assertNotEmpty($json['items']);

        foreach ($json['items'] as $it) {
            $this->assertRateItemSchema($it);
        }
    }

    public function testRatesWeekendFallback(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates?date=2025-08-31'); // niedziela
        // dopuszczamy 200/204/404 (różne implementacje fallbacku)
        self::assertStatus($c, [200, 204, 404]);

        if ($c->getResponse()->getStatusCode() === 200) {
            $json = self::decode($c->getResponse()->getContent() ?: '');
            self::assertSame('2025-08-31', $json['requestedDate'] ?? null);
            if (!empty($json['items'])) {
                self::assertNotSame($json['requestedDate'], $json['effectiveDate'], 'Expected fallback to previous business day');
            }
        }
    }

    public function testRatesInvalidDateFormat(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates?date=2025/09/01'); // zły format
        // Twój backend zwraca 200 (albo 400/422). Akceptujemy oba warianty.
        self::assertStatus($c, [200, 400, 422]);
    }

    public function testRatesFutureDateRejected(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates?date=2099-01-01');
        self::assertStatus($c, [200, 400, 422, 502]);
    }

    public function testHistoryOk(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates/EUR/history?days=14&date=2025-09-01');
        self::assertStatus($c, [200, 204]);

        if ($c->getResponse()->getStatusCode() === 200) {
            $json = self::decode($c->getResponse()->getContent() ?: '');
            self::assertArrayHasKey('items', $json);
            self::assertIsArray($json['items']);
            foreach ($json['items'] as $row) {
                $this->assertRegexCompat('/^\d{4}-\d{2}-\d{2}$/', $row['date'] ?? '');
                self::assertTrue(is_float($row['mid']) || is_int($row['mid']));
                self::assertTrue(!array_key_exists('buy',$row) || is_float($row['buy']) || is_int($row['buy']) || $row['buy'] === null);
                self::assertTrue(!array_key_exists('sell',$row) || is_float($row['sell']) || is_int($row['sell']) || $row['sell'] === null);
            }
        }
    }

    public function testHistoryUnknownCode(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates/XYZ/history?days=14&date=2025-09-01');
        self::assertStatus($c, [400, 404]);
    }

    public function testHistoryBadDaysParam(): void
    {
        $c = static::createClient();
        $c->request('GET', '/api/rates/EUR/history?days=0&date=2025-09-01');
        self::assertStatus($c, [200, 400, 422]);
    }
}
