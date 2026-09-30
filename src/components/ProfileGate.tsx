"use client";

import BirthForm from "./BirthForm";
import PageHeader from "./PageHeader";
import type { BirthInfo } from "@/lib/bazi";
import { saveProfile, useProfile } from "@/lib/profile";

/** 需要出生信息的页面：未设置档案时先显示表单 */
export default function ProfileGate({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: (profile: BirthInfo) => React.ReactNode;
}) {
  const [profile, ready] = useProfile();
  if (!ready) return <PageHeader title={title} />;
  if (!profile) {
    return (
      <div>
        <PageHeader title={title} subtitle={subtitle} />
        <section className="card p-3.5 lg:max-w-2xl lg:p-5">
          <p className="mb-4 text-sm text-muted">请先填写出生信息，将自动保存为您的档案。</p>
          <BirthForm submitLabel="开始排盘" onSubmit={(info) => saveProfile(info)} />
        </section>
      </div>
    );
  }
  return <>{children(profile)}</>;
}
