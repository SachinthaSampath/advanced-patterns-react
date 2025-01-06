import { changeEmailSchema } from "@advanced-react/shared/schema/auth/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import Button from "@/features/shared/components/ui/Button";
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

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

type ChangeEmailFormProps = {
  onSuccess?: () => void;
};

export function ChangeEmailForm({ onSuccess }: ChangeEmailFormProps) {
  const { toast } = useToast();

  const form = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  });

  const changeEmailMutation = trpc.users.changeEmail.useMutation({
    onSuccess: () => {
      form.reset();

      toast({
        title: "Email changed successfully",
      });

      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to change email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ChangeEmailFormData) {
    changeEmailMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={changeEmailMutation.isPending}>
          {changeEmailMutation.isPending ? "Loading..." : "Change Email"}
        </Button>
      </form>
    </Form>
  );
}
