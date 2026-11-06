import LoginForm from "./LoginForm";
import SplashScreen from "./SplashScreen";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-5">
      <SplashScreen />
      <div className="flex min-w-0 flex-col justify-center lg:col-span-3">
        <LoginForm />
      </div>
    </main>
  );
}
