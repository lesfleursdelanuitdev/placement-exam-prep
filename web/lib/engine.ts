// The engine on the server: one shared copy with the exam model (web/engine). Lessons, examples
// and cards are the same for everyone, so they are made from this copy once.
import { MX } from '@/engine/mx.mjs';
import { createModel } from '@/engine/model.mjs';

export const model = createModel(MX);
export { MX };
