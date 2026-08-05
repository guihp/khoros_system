"use client";

import { use } from "react";
import { PageSectionsEditorPage } from "@/components/admin/cms/PageSectionsEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AdminCmsPageSectionsRoute({ params }: PageProps) {
  const { slug } = use(params);
  return <PageSectionsEditorPage slug={slug} />;
}
