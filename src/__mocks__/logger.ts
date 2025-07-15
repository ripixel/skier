// Shared mock logger for all Skier tests (built-ins, CLI, etc)
export function createTaskLogger(taskName: string, debug: boolean) {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}
