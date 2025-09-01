<?php
namespace App\Tests\Unit;

use App\Service\RateCalculator;
use PHPUnit\Framework\TestCase;

final class RateCalculatorTest extends TestCase
{
    public function testEurUsdMargins(): void {
        $rc = new RateCalculator();
        $out = $rc->compute('EUR', 4.1234);
        $this->assertSame(3.9734, $out['buy']);
        $this->assertSame(4.2334, $out['sell']);
    }
    public function testOtherMargins(): void {
        $rc = new RateCalculator();
        $out = $rc->compute('CZK', 0.1677);
        $this->assertNull($out['buy']);
        $this->assertSame(0.3677, $out['sell']); // 0.1677 + 0.2 = 0.3677
    }
}
