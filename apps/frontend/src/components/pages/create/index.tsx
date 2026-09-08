import { PageHeader } from "@/components/ui/PageHeader";
import { IndexBuilderForm } from "./components/IndexBuilderForm";

export const CreatePage = () => (
  <div className="mx-auto max-w-3xl space-y-8">
    <PageHeader
      title="Create an index"
      description="Every constituent becomes a subname. Weights are published as text records anyone can read."
    />
    <IndexBuilderForm />
  </div>
);
