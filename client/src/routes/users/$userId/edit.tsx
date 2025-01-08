import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import UserEditForm from "@/features/user/components/UserEditForm";
import { router, trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/edit")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  beforeLoad: async ({ params, context: { trpcQueryUtils } }) => {
    const { currentUser } = await trpcQueryUtils.auth.currentUser.ensureData();

    const user = await trpcQueryUtils.users.byId.ensureData({
      id: params.userId,
    });

    if (!currentUser || currentUser.id !== user.id) {
      throw redirect({
        to: "/users/$userId",
        params: { userId: params.userId },
      });
    }
  },
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await trpcQueryUtils.users.byId.ensureData({ id: params.userId });
  },
  component: EditProfile,
});

function EditProfile() {
  const { userId } = Route.useParams();

  const userQuery = trpc.users.byId.useQuery({ id: userId });

  if (userQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (userQuery.error) {
    return <div>Error: {userQuery.error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <h1 className="mb-4 text-2xl font-bold">Edit Profile</h1>
        <UserEditForm
          user={userQuery.data}
          onSuccess={(id) =>
            router.navigate({
              to: "/users/$userId",
              params: { userId: id },
            })
          }
          onCancel={() => router.history.back()}
        />
      </div>
    </div>
  );
}
