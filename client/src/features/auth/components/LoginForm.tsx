import { userCredentialsSchema } from "@advanced-react/shared/schema/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import { useToast } from "@/features/shared/hooks/useToast";
import { router, trpc } from "@/router";

type LoginFormData = z.infer<typeof userCredentialsSchema>;

export default function LoginForm() {
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess() {
      utils.auth.currentUser.invalidate();
      router.navigate({ to: "/" });
    },
    onError() {
      toast({
        title: "Failed to login",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(userCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField<LoginFormData> name="email" label="Email">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              type="email"
              error={error}
              disabled={loginMutation.isPending}
            />
          )}
        </FormField>
        <FormField<LoginFormData> name="password" label="Password">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              type="password"
              error={error}
              disabled={loginMutation.isPending}
            />
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
