import { zodResolver as hookFormZodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type * as z from 'zod';

export function zodResolver<TSchema extends z.ZodType<FieldValues, FieldValues>>(
    schema: TSchema
): Resolver<z.input<TSchema>, unknown, z.output<TSchema>> {
    return hookFormZodResolver(schema as never) as unknown as Resolver<
        z.input<TSchema>,
        unknown,
        z.output<TSchema>
    >;
}
