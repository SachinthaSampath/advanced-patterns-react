import { userCredentialsSchema } from "@advanced-react/shared/schema/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import { useToast } from "@/features/shared/hooks/useToast";
import { router, trpc } from "@/router";

type RegisterFormData = z.infer<typeof userCredentialsSchema>;

export default function RegisterForm() {
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess() {
      utils.auth.currentUser.invalidate();
      router.navigate({ to: "/" });
    },
    onError() {
      toast({
        title: "Failed to register",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(userCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: RegisterFormData) {
    registerMutation.mutate(data);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField<RegisterFormData> name="email" label="Email">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              type="email"
              error={error}
              disabled={registerMutation.isPending}
            />
          )}
        </FormField>
        <FormField<RegisterFormData> name="password" label="Password">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              type="password"
              error={error}
              disabled={registerMutation.isPending}
            />
          )}
        </FormField>
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account..." : "Register"}
        </Button>
      </form>
    </FormProvider>
  );
}
