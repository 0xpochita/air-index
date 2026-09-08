import { CreateHero } from "./components/CreateHero";
import { IndexBuilderForm } from "./components/IndexBuilderForm";

export const CreatePage = () => (
  <div className="mx-auto max-w-3xl space-y-6">
    <CreateHero />
    <IndexBuilderForm />
  </div>
);
