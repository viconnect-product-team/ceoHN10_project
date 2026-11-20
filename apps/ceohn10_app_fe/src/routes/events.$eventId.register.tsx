import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/events/$eventId/register")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/guest-event-register/$eventId",
      params: { eventId: params.eventId },
    });
  },
  component: () => null,
});
