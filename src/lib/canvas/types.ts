/** Minimal shape of Canvas's `GET /api/v1/users/self` response — only the fields this app reads. */
export type CanvasSelfUser = {
  id: number;
  name: string;
};

export type CanvasHealth = {
  ok: boolean;
  message: string;
};
