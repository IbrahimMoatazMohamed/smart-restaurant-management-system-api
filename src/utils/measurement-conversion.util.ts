import Measurement from 'src/menu-entities/ingredients/types/measurement.enum';
import { BadRequestException } from '@nestjs/common';

/**
 * Conversion factors for different measurement units
 * Base units: kg, l, pc
 */
const conversionFactors = {
  // Weight conversions
  [Measurement.KILOGRAM]: {
    [Measurement.KILOGRAM]: 1,
    [Measurement.GRAM]: 1000,
    [Measurement.POUND]: 2.20462,
    [Measurement.OUNCE]: 35.274,
  },
  [Measurement.GRAM]: {
    [Measurement.KILOGRAM]: 0.001,
    [Measurement.GRAM]: 1,
    [Measurement.POUND]: 0.00220462,
    [Measurement.OUNCE]: 0.035274,
  },
  [Measurement.POUND]: {
    [Measurement.KILOGRAM]: 0.453592,
    [Measurement.GRAM]: 453.592,
    [Measurement.POUND]: 1,
    [Measurement.OUNCE]: 16,
  },
  [Measurement.OUNCE]: {
    [Measurement.KILOGRAM]: 0.0283495,
    [Measurement.GRAM]: 28.3495,
    [Measurement.POUND]: 0.0625,
    [Measurement.OUNCE]: 1,
  },

  // Volume conversions
  [Measurement.LITER]: {
    [Measurement.LITER]: 1,
    [Measurement.MILLILITER]: 1000,
    [Measurement.GALLON]: 0.264172,
    [Measurement.QUART]: 1.05669,
    [Measurement.PINT]: 2.11338,
    [Measurement.CUP]: 4.22675,
    [Measurement.TABLESPOON]: 67.628,
    [Measurement.TEASPOON]: 202.884,
  },
  [Measurement.MILLILITER]: {
    [Measurement.LITER]: 0.001,
    [Measurement.MILLILITER]: 1,
    [Measurement.GALLON]: 0.000264172,
    [Measurement.QUART]: 0.00105669,
    [Measurement.PINT]: 0.00211338,
    [Measurement.CUP]: 0.00422675,
    [Measurement.TABLESPOON]: 0.067628,
    [Measurement.TEASPOON]: 0.202884,
  },
  [Measurement.GALLON]: {
    [Measurement.LITER]: 3.78541,
    [Measurement.MILLILITER]: 3785.41,
    [Measurement.GALLON]: 1,
    [Measurement.QUART]: 4,
    [Measurement.PINT]: 8,
    [Measurement.CUP]: 16,
    [Measurement.TABLESPOON]: 256,
    [Measurement.TEASPOON]: 768,
  },
  [Measurement.QUART]: {
    [Measurement.LITER]: 0.946353,
    [Measurement.MILLILITER]: 946.353,
    [Measurement.GALLON]: 0.25,
    [Measurement.QUART]: 1,
    [Measurement.PINT]: 2,
    [Measurement.CUP]: 4,
    [Measurement.TABLESPOON]: 64,
    [Measurement.TEASPOON]: 192,
  },
  [Measurement.PINT]: {
    [Measurement.LITER]: 0.473176,
    [Measurement.MILLILITER]: 473.176,
    [Measurement.GALLON]: 0.125,
    [Measurement.QUART]: 0.5,
    [Measurement.PINT]: 1,
    [Measurement.CUP]: 2,
    [Measurement.TABLESPOON]: 32,
    [Measurement.TEASPOON]: 96,
  },
  [Measurement.CUP]: {
    [Measurement.LITER]: 0.236588,
    [Measurement.MILLILITER]: 236.588,
    [Measurement.GALLON]: 0.0625,
    [Measurement.QUART]: 0.25,
    [Measurement.PINT]: 0.5,
    [Measurement.CUP]: 1,
    [Measurement.TABLESPOON]: 16,
    [Measurement.TEASPOON]: 48,
  },
  [Measurement.TABLESPOON]: {
    [Measurement.LITER]: 0.0147868,
    [Measurement.MILLILITER]: 14.7868,
    [Measurement.GALLON]: 0.00390625,
    [Measurement.QUART]: 0.015625,
    [Measurement.PINT]: 0.03125,
    [Measurement.CUP]: 0.0625,
    [Measurement.TABLESPOON]: 1,
    [Measurement.TEASPOON]: 3,
  },
  [Measurement.TEASPOON]: {
    [Measurement.LITER]: 0.00492892,
    [Measurement.MILLILITER]: 4.92892,
    [Measurement.GALLON]: 0.00130208,
    [Measurement.QUART]: 0.00520833,
    [Measurement.PINT]: 0.0104167,
    [Measurement.CUP]: 0.0208333,
    [Measurement.TABLESPOON]: 0.333333,
    [Measurement.TEASPOON]: 1,
  },

  // Count - cannot be converted to other measurement types
  [Measurement.PIECE]: { [Measurement.PIECE]: 1 },
};

/**
 * Measurement categories for compatibility checking
 */
const measurementCategories = {
  WEIGHT: [
    Measurement.KILOGRAM,
    Measurement.GRAM,
    Measurement.POUND,
    Measurement.OUNCE,
  ],
  VOLUME: [
    Measurement.LITER,
    Measurement.MILLILITER,
    Measurement.GALLON,
    Measurement.QUART,
    Measurement.PINT,
    Measurement.CUP,
    Measurement.TABLESPOON,
    Measurement.TEASPOON,
  ],
  COUNT: [Measurement.PIECE],
};

/**
 * Check if two measurements are compatible for conversion
 * @param from Source measurement unit
 * @param to Target measurement unit
 * @returns boolean indicating if conversion is possible
 */
export function areMeasurementsCompatible(
  from: Measurement,
  to: Measurement,
): boolean {
  // Same measurement is always compatible
  if (from === to) return true;

  // Check if both measurements are in the same category
  return Object.values(measurementCategories).some(
    (category) => category.includes(from) && category.includes(to),
  );
}

/**
 * Convert a quantity from one measurement unit to another
 * @param amount Amount to convert
 * @param from Source measurement unit
 * @param to Target measurement unit
 * @returns Converted amount
 */
export function convertMeasurement(
  amount: number,
  from: Measurement,
  to: Measurement,
): number {
  // If measurements are the same, no conversion needed
  if (from === to) return amount;

  // Check if conversion is possible
  if (!areMeasurementsCompatible(from, to)) {
    throw new BadRequestException(
      `Cannot convert from ${from} to ${to}. Incompatible measurement units.`,
    );
  }

  // Get conversion factor
  const conversionFactor = conversionFactors[from]?.[to] as number | undefined;

  if (conversionFactor === undefined) {
    throw new BadRequestException(
      `Conversion from ${from} to ${to} is not supported.`,
    );
  }

  // Apply conversion
  return amount * conversionFactor;
}

/**
 * Convert a quantity to the target measurement if needed
 * @param amount Amount to convert
 * @param sourceMeasurement Source measurement unit
 * @param targetMeasurement Target measurement unit
 * @returns Object with converted amount and whether conversion was performed
 */
export function convertQuantityIfNeeded(
  amount: number,
  sourceMeasurement: Measurement,
  targetMeasurement: Measurement,
): { convertedAmount: number; wasConverted: boolean } {
  if (sourceMeasurement === targetMeasurement) {
    return { convertedAmount: amount, wasConverted: false };
  }

  const convertedAmount = convertMeasurement(
    amount,
    sourceMeasurement,
    targetMeasurement,
  );
  return { convertedAmount, wasConverted: true };
}
