// import { redirect, type RemoteQueryFunction } from '@sveltejs/kit';
// import { getUser } from './auth.remote';
// import { resolve } from '$app/paths';
// import { form, query } from '$app/server';
// import * as v from 'valibot';
// import type { userTable } from '$lib/server/db/schema';

// type User = typeof userTable.$inferSelect;
// type Procedure = <Input, Output>(input: Input, user: User) => Promise<Output>;

// function withAuth<P extends Procedure>(baseProcedure: P) {
//     function authedProcedure<Input, Output>(
//         schema: v.BaseSchema<unknown, Input, v.BaseIssue<unknown>>,
//         handler: (input: Input, user: User) => Promise<Output>
//     ): ReturnType<P>;

//     function authedProcedure<Output>(handler: (user: User) => Promise<Output>): ReturnType<P>;

//     function authedProcedure<Input, Output>(
//         schemaOrHandler:
//             | v.BaseSchema<unknown, Input, v.BaseIssue<unknown>>
//             | ((user: User) => Promise<Output>),
//         maybeHandler?: (input: Input, user: User) => Promise<Output>
//     ): ReturnType<P> {
//         if (typeof schemaOrHandler === 'function') {
//             const handler = schemaOrHandler;
//             return baseProcedure(async () => {
//                 const user = await getUser();
//                 if (!user) redirect(302, resolve('/login'));
//                 return handler(user);
//             });
//         }
//         const schema = schemaOrHandler;
//         const handler = maybeHandler!;
//         return baseProcedure(schema, async (input) => {
//             const user = await getUser();
//             if (!user) redirect(302, resolve('/login'));
//             return handler(input, user);
//         });
//     }
//     return authedProcedure;
// }

// export function authedQuery<Input, Output>(
//     schema: v.BaseSchema<unknown, Input, v.BaseIssue<unknown>>,
//     handler: (input: Input, user: User) => Promise<Output>
// ): RemoteQueryFunction<Input, Output>;

// export function authedQuery<Output>(
//     handler: (user: User) => Promise<Output>
// ): RemoteQueryFunction<void, Output>;

// export function authedQuery<Input, Output>(
//     schemaOrHandler:
//         | v.BaseSchema<unknown, Input, v.BaseIssue<unknown>>
//         | ((user: User) => Promise<Output>),
//     maybeHandler?: (input: Input, user: User) => Promise<Output>
// ) {
//     if (typeof schemaOrHandler === 'function') {
//         const handler = schemaOrHandler;
//         return query(async () => {
//             const user = await getUser();
//             if (!user) redirect(302, resolve('/login'));
//             return handler(user);
//         });
//     }

//     const schema = schemaOrHandler;
//     const handler = maybeHandler!;

//     return query(schema, async (input) => {
//         const user = await getUser();
//         if (!user) redirect(302, resolve('/login'));
//         return handler(input, user);
//     });
// }

// export async function authedForm<Input, Output>(
//     schema: v.BaseSchema<unknown, Input, v.BaseIssue<unknown>>,
//     handler: (input: Input, user: typeof userTable.$inferSelect) => Promise<Output>
// ) {
//     return form(schema, async (input) => {
//         const user = await getUser();
//         if (!user) redirect(302, resolve('/login'));
//         return handler(input, user);
//     });
// }
