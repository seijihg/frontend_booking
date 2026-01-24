import { redirect } from "next/navigation";
import Image from "next/image";
import LoginForm from "@/components/authentication/Login";
import getUser from "@/api/userApi";

export default async function LoginPage() {
  // Server-side authentication check
  const data = await getUser();
  const user = data?.user;

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            className="mx-auto h-10 w-auto"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            alt="Your Company"
            width={40}
            height={40}
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <LoginForm />
      </div>
    </>
  );
}
