import { userCredentialsSchema } from "@advanced-react/shared/schema/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import { useToast } from "@/features/shared/hooks/useToast";
import { router, trpc } from "@/router";

const loginCredentialsSchema = userCredentialsSchema.omit({
  name: true,
});

type LoginFormData = z.infer<typeof loginCredentialsSchema>;

export default function LoginForm() {
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.currentUser.invalidate();

      router.navigate({ to: "/" });

      toast({
        title: "Logged in",
        description: "You have been logged in",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    loginMutation.mutate(data);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField<LoginFormData> name="email" label="Email">
          {({ error, name }) => (
            <Input {...form.register(name)} type="email" error={error} />
          )}
        </FormField>
        <FormField<LoginFormData> name="password" label="Password">
          {({ error, name }) => (
            <Input {...form.register(name)} type="password" error={error} />
          )}
        </FormField>
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </form>
    </FormProvider>
  );
}
