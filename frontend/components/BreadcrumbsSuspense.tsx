import { Suspense, type ComponentProps } from "react";
import Breadcrumbs from "@/components/Breadcrumb";

type Props = ComponentProps<typeof Breadcrumbs>;

export default function BreadcrumbsSuspense(props: Props) {
  return (
    <Suspense fallback={<div className="h-5" />}>
      <Breadcrumbs {...props} />
    </Suspense>
  );
}
