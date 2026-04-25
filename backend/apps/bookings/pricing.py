"""
Parvona — Dinamik narxlash moduli
==================================
Qoidalar:
  - Tunda (22:00-06:00 oralig'idagi soatlar)  → +20%
  - Bayram kunlari                              → +30%
  - Shoshilinch bron (24 soat ichida)           → +15%
  - Uzoq muddatli (7+ kun)                      → -10%

Barcha surcharge lar qo'shiladi, lekin chegirma oxirida qo'llaniladi.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal


# O'zbekiston rasmiy bayram kunlari (oy-kun, yil-mustaqil)
UZBEKISTAN_HOLIDAYS: set[tuple[int, int]] = {
    (1,  1),   # Yangi yil
    (3,  8),   # Xalqaro xotin-qizlar kuni
    (3, 21),   # Navro'z
    (5,  9),   # Xotira va qadrlash kuni
    (6,  1),   # Bolalar himoyasi kuni
    (9,  1),   # Mustaqillik kuni
    (10, 1),   # O'qituvchilar kuni
    (12, 8),   # O'zbekiston Konstitutsiyasi kuni
    # Ramazon Hayit va Qurbon Hayit: har yili o'zgaradi,
    # munosabat bilan umumiy 3 kun qo'shiladi.
    # Bular dinamik sifatida AdminPanel dan qo'shilishi mumkin.
}


def is_holiday(d: date) -> bool:
    return (d.month, d.day) in UZBEKISTAN_HOLIDAYS


def is_urgent(start_date: date) -> bool:
    """24 soat ichida boshlansa — shoshilinch."""
    return (start_date - date.today()).days < 1


def is_long_term(start_date: date, end_date: date) -> bool:
    """7 yoki undan ko'p kun — uzoq muddatli."""
    return (end_date - start_date).days + 1 >= 7


@dataclass
class PriceBreakdown:
    """Narx tarkibi — frontend ga to'liq tushuntirish uchun."""
    base_amount:       int = 0   # soat_narxi × soat × kun
    night_surcharge:   int = 0   # +20% tunda
    holiday_surcharge: int = 0   # +30% bayram
    urgent_surcharge:  int = 0   # +15% shoshilinch
    long_term_discount:int = 0   # -10% uzoq muddatli (manfiy qiymat)
    total_amount:      int = 0   # yakuniy summa

    applied_rules: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "base_amount":        self.base_amount,
            "night_surcharge":    self.night_surcharge,
            "holiday_surcharge":  self.holiday_surcharge,
            "urgent_surcharge":   self.urgent_surcharge,
            "long_term_discount": self.long_term_discount,
            "total_amount":       self.total_amount,
            "applied_rules":      self.applied_rules,
        }


def calculate_price(
    hourly_rate: int,
    hours_per_day: Decimal | float,
    start_date: date,
    end_date: date,
    night_hours: int = 0,   # Kunlik necha soati tunda (22:00-06:00)
) -> PriceBreakdown:
    """
    Dinamik narx hisoblash.

    Parameters
    ----------
    hourly_rate   : Enaganing asosiy soatlik narxi (so'm)
    hours_per_day : Kunlik ish soati
    start_date    : Boshlanish sanasi
    end_date      : Tugash sanasi
    night_hours   : Kunlik necha soati tunda (default 0)
    """
    hours = Decimal(str(hours_per_day))
    rate  = Decimal(str(hourly_rate))

    days  = (end_date - start_date).days + 1
    bd    = PriceBreakdown()

    # 1. Asosiy summa
    bd.base_amount = int(days * hours * rate)

    # 2. Tunda qo'shimchasi (+20% tunda soatlar uchun)
    if night_hours > 0:
        day_hours   = max(hours - Decimal(str(night_hours)), Decimal('0'))
        night_extra = int(days * Decimal(str(night_hours)) * rate * Decimal('0.20'))
        bd.night_surcharge = night_extra
        bd.applied_rules.append(f"Tunda ({night_hours} soat/kun) +20%")

    # 3. Bayram kuni qo'shimchasi (+30%)
    holiday_days = sum(1 for i in range(days) if is_holiday(start_date + timedelta(days=i)))
    if holiday_days > 0:
        holiday_extra = int(holiday_days * hours * rate * Decimal('0.30'))
        bd.holiday_surcharge = holiday_extra
        bd.applied_rules.append(f"Bayram kuni ({holiday_days} kun) +30%")

    # 4. Shoshilinch bron (+15%)
    if is_urgent(start_date):
        urgent_extra = int(bd.base_amount * Decimal('0.15'))
        bd.urgent_surcharge = urgent_extra
        bd.applied_rules.append("Shoshilinch bron +15%")

    # 5. Uzoq muddatli chegirma (-10%, faqat 7+ kun)
    if is_long_term(start_date, end_date):
        subtotal = bd.base_amount + bd.night_surcharge + bd.holiday_surcharge + bd.urgent_surcharge
        discount = int(subtotal * Decimal('0.10'))
        bd.long_term_discount = -discount
        bd.applied_rules.append(f"Uzoq muddatli ({days} kun) -10%")

    # Yakuniy summa
    bd.total_amount = (
        bd.base_amount
        + bd.night_surcharge
        + bd.holiday_surcharge
        + bd.urgent_surcharge
        + bd.long_term_discount  # manfiy
    )

    return bd
