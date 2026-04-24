import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function IsStrictIsoDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStrictIsoDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
          }

          const date = new Date(`${value}T00:00:00Z`);

          return (
            !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must use yyyy-mm-dd format`;
        },
      },
    });
  };
}
