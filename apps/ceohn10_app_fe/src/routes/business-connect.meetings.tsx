import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/business-connect/meetings")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
