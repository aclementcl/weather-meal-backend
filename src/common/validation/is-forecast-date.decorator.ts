import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import {
  addDaysToIsoDate,
  getCurrentChileIsoDate,
} from '../date/chile-date.util';

export function IsForecastDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isForecastDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
          }

          if (!isStrictIsoDate(value)) {
            return false;
          }

          const minDate = getCurrentChileIsoDate();
          const maxDate = addDaysToIsoDate(minDate, 6);

          return value >= minDate && value <= maxDate;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be between today and the next 6 days`;
        },
      },
    });
  };
}

function isStrictIsoDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
