/**
 * Validation schemas using Zod
 * Centralizes all input validation for the application
 */

import { z } from 'zod';

// Base validation schemas
export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date');

export const TimestampSchema = z
  .string()
  .datetime('Invalid timestamp format');

// Todo validation schemas
export const EisenhowerCategorySchema = z.enum(['do', 'schedule', 'delegate', 'eliminate'] as const);

export const TodoTextSchema = z
  .string()
  .min(1, 'Todo text cannot be empty')
  .max(500, 'Todo text cannot exceed 500 characters')
  .trim();

export const TodoSchema = z.object({
  id: UUIDSchema,
  text: TodoTextSchema,
  completed: z.boolean(),
  category: EisenhowerCategorySchema,
});

export const CreateTodoSchema = z.object({
  text: TodoTextSchema,
  category: EisenhowerCategorySchema.default('do'),
});

export const UpdateTodoSchema = z.object({
  id: UUIDSchema,
  text: TodoTextSchema.optional(),
  completed: z.boolean().optional(),
  category: EisenhowerCategorySchema.optional(),
}).refine(
  (data) => data.text !== undefined || data.completed !== undefined || data.category !== undefined,
  'At least one field must be provided for update'
);

// Artifact validation schemas
export const ArtifactTextSchema = z
  .string()
  .min(1, 'Artifact text cannot be empty')
  .max(1000, 'Artifact text cannot exceed 1000 characters')
  .trim();

export const TaskNameSchema = z
  .string()
  .max(200, 'Task name cannot exceed 200 characters')
  .trim()
  .optional();

export const ArtifactSchema = z.object({
  text: ArtifactTextSchema,
  timestamp: TimestampSchema,
  task: TaskNameSchema.default(''),
});

export const CreateArtifactSchema = z.object({
  text: ArtifactTextSchema,
  task: TaskNameSchema.default(''),
});

// Settings validation schemas
export const TimerDurationSchema = z
  .number()
  .int('Duration must be a whole number')
  .min(1, 'Duration must be at least 1 minute')
  .max(120, 'Duration cannot exceed 120 minutes');

export const IntervalSchema = z
  .number()
  .int('Interval must be a whole number')
  .min(1, 'Interval must be at least 1')
  .max(10, 'Interval cannot exceed 10');

export const TimerSettingsSchema = z.object({
  workTime: TimerDurationSchema.default(25),
  shortBreakTime: TimerDurationSchema.default(5),
  longBreakTime: TimerDurationSchema.default(15),
  longBreakInterval: IntervalSchema.default(4),
  autoStartBreaks: z.boolean().default(false),
  autoStartPomodoros: z.boolean().default(false),
  soundEnabled: z.boolean().default(true),
  notificationsEnabled: z.boolean().default(true),
});

// Import/Export validation schemas
export const DayDataSchema = z.object({
  artifacts: z.array(ArtifactSchema),
  todos: z.array(TodoSchema),
});

export const DailyDataSchema = z.record(
  DateStringSchema,
  DayDataSchema
);

export const ImportDataSchema = z.object({
  data: DailyDataSchema,
  version: z.string().optional(),
  exportedAt: TimestampSchema.optional(),
});

// Auth validation schemas
export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email cannot exceed 254 characters');

export const PasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password cannot exceed 128 characters');

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

// API request validation schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
});

export const DateRangeSchema = z.object({
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  'Start date must be before or equal to end date'
);

export const GetTodosQuerySchema = PaginationSchema.extend({
  date: DateStringSchema.optional(),
  category: EisenhowerCategorySchema.optional(),
  completed: z.boolean().optional(),
});

export const GetArtifactsQuerySchema = PaginationSchema.extend({
  dateRange: DateRangeSchema.optional(),
});

// Type exports for TypeScript
export type TodoInput = z.infer<typeof CreateTodoSchema>;
export type TodoUpdate = z.infer<typeof UpdateTodoSchema>;
export type ArtifactInput = z.infer<typeof CreateArtifactSchema>;
export type TimerSettingsInput = z.infer<typeof TimerSettingsSchema>;
export type ImportData = z.infer<typeof ImportDataSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type GetTodosQuery = z.infer<typeof GetTodosQuerySchema>;
export type GetArtifactsQuery = z.infer<typeof GetArtifactsQuerySchema>;