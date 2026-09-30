"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BirthForm from "@/components/BirthForm";
import PageHeader from "@/components/PageHeader";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import ScriptToggle from "@/components/ScriptToggle";
import { ageOn, computeBazi } from "@/lib/bazi";
import { useToday } from "@/lib/useToday";
import { saveProfile, useProfile } from "@/lib/profile";
import { clearChat } from "@/lib/chatStore";
import { logout } from "@/lib/logout";

export default function ProfilePage() {
  const [profile, ready, isDefault] = useProfile();
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const bazi = profile ? computeBazi(profile) : null;
  // 虚岁随日期更新：每过春节自动加一岁
  const today = useToday();
  const age = bazi && today ? ageOn(bazi, today) : null;

  return (
    <div>
      <PageHeader title="我的档案" subtitle="出生信息仅保存在本机浏览器中" back={false} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
      <div>

      {!ready ? (
        <div className="h-64 animate-pulse rounded-2xl bg-card-2" />
      ) : profile && bazi && !editing ? (
        <section className="card p-3.5">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-3">
            <span className="text-sm text-muted">切换档案</span>
            <ProfileSwitcher />
          </div>
          <div className="flex items-center gap-3">
            <span className="seal flex h-14 w-14 items-center justify-center rounded-full font-serif text-2xl">
              {profile.name?.[0] ?? "缘"}
            </span>
            <div>
              <p className="font-serif text-xl font-bold">{profile.name ?? "缘主"}</p>
              <p className="text-sm text-muted">
                {profile.gender === "male" ? "男" : "女"} · {bazi.shengXiaoWx} · 日主{bazi.dayMaster}
                {bazi.dayMasterWx}
              </p>
            </div>
          </div>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">公历</dt><dd>{bazi.solarText}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">农历</dt><dd>{bazi.lunarText}</dd></div>
            {age && (
              <div className="flex justify-between">
                <dt className="text-muted">虚岁</dt>
                <dd>
                  <b>{age.nominal}</b> 岁<span className="ml-1.5 text-muted">（周岁 {age.actual}）</span>
                </dd>
              </div>
            )}
            {profile.place && (
              <div className="flex justify-between"><dt className="text-muted">出生地</dt><dd>{profile.place}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">八字</dt>
              <dd className="font-serif tracking-wider">{bazi.pillars.map((p) => p.gan + p.zhi).join(" ")}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => setEditing(true)}>修改信息</button>
            <button className="btn-primary" onClick={() => router.push("/bazi")}>查看命盘</button>
          </div>
        </section>
      ) : (
        <section className="card p-3.5">
          <p className="mb-4 text-sm text-muted">
            填写出生信息后，首页将显示专属每日运势，AI 大师也会结合您的命盘作答。
          </p>
          <BirthForm
            initial={profile}
            submitLabel="保存档案"
            onSubmit={(info) => {
              saveProfile(info);
              setEditing(false);
            }}
          />
          {editing && (
            <button className="btn-ghost mt-2 w-full" onClick={() => setEditing(false)}>取消</button>
          )}
        </section>
      )}

      </div>

      <div className="space-y-4">
      <section className="card divide-y divide-line text-sm">
        <div className="flex items-center justify-between p-3.5">
          <span>文字显示（简体 / 繁体）</span>
          <ScriptToggle />
        </div>
        <button className="flex w-full items-center justify-between p-3.5 text-left font-semibold text-cinnabar" onClick={() => void logout()}>
          退出登录
        </button>
        <button
          className="flex w-full items-center justify-between p-3.5 text-left"
          onClick={() => {
            if (confirm("确定清除与 AI 大师的全部聊天记录吗？")) clearChat();
          }}
        >
          清除聊天记录
        </button>
        {!isDefault && (
          <button
            className="flex w-full items-center justify-between p-3.5 text-left text-bad"
            onClick={() => {
              if (confirm("确定清除修改，恢复默认档案吗？")) saveProfile(null);
            }}
          >
            恢复默认档案
          </button>
        )}
      </section>

      <section className="rounded-2xl bg-card-2 p-3.5 text-xs leading-relaxed text-muted">
        <p className="mb-1 font-semibold text-ink">免责声明</p>
        本应用基于传统命理学（八字、黄历、周易、玄空飞星、八宅）进行程序化推算，并由 AI 进行解读，
        内容仅供娱乐与传统文化学习参考，不构成医疗、法律、财务或其他任何专业建议。请理性看待，命运掌握在自己手中。
        <p className="mt-2">隐私：出生信息与聊天记录仅保存在您的浏览器本地；向 AI 大师提问时，问题与命盘摘要会发送至服务器用于生成回答。</p>
      </section>
      </div>
      </div>
    </div>
  );
}
