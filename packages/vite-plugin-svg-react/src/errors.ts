/** The message of a thrown value, which isn’t necessarily an Error. */
export const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);
