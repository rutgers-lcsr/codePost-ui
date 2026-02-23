// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
