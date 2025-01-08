import { User } from "@advanced-react/server/database/schema";
import { userValidationSchema } from "@advanced-react/shared/schema/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/features/shared/components/ui/Button";
import FileInput from "@/features/shared/components/ui/FileInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/shared/components/ui/Form";
import Input from "@/features/shared/components/ui/Input";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type UserFormData = z.infer<typeof userValidationSchema>;

type UserEditFormProps = {
  user: User;
  onSuccess?: (id: User["id"]) => void;
  onCancel?: () => void;
};

function UserEditForm({ user, onSuccess, onCancel }: UserEditFormProps) {
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userValidationSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
    },
  });

  const updateUserMutation = trpc.users.edit.useMutation({
    onSuccess: (data) => {
      onSuccess?.(data[0].id);
    },
    onError: (error) => {
      toast({
        title: "Failed to edit user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: UserFormData) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob);
      }
    }

    updateUserMutation.mutate(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Photo</FormLabel>
              <FormControl>
                <FileInput
                  accept="image/*"
                  value={undefined}
                  onChange={(event) => {
                    field.onChange(event.target?.files?.[0]);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default UserEditForm;
