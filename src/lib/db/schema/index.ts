// The twelve tables in PRD "Data model". Every table has row-level security enabled: the app
// connects as the table owner, which bypasses it, while Supabase's API roles see nothing until a
// policy grants it. Change the schema here, then run `npm run db:generate` for a new migration.
export * from "./enums";
export * from "./markets";
export * from "./runs";
export * from "./scenarios";
