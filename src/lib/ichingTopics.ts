export interface IChingTopic {
  title: string;
  desc: string;
}

export interface IChingCategory {
  name: string;
  topics: IChingTopic[];
}

/** 求测方向：大类 → 具体问题 */
export const ICHING_CATEGORIES: IChingCategory[] = [
  {
    name: "感情婚姻",
    topics: [
      { title: "单身姻缘", desc: "是否有缘分 · 何时出现对象" },
      { title: "暧昧发展", desc: "能否在一起 · 关系会如何发展" },
      { title: "恋人关系", desc: "感情状态如何 · 是否稳定长久" },
      { title: "前任复合", desc: "是否还有机会 · 能否重新在一起" },
      { title: "婚姻状态", desc: "婚姻是否稳定 · 是否存在问题" },
      { title: "分手/离婚判断", desc: "是否应该分开 · 分开是否更好" },
    ],
  },
  {
    name: "人际关系",
    topics: [
      { title: "关系好坏", desc: "对方怎么看你 · 关系真实状态" },
      { title: "是否有小人", desc: "是否被针对 · 是否有人暗中影响" },
      { title: "冲突结果", desc: "矛盾会如何发展 · 结果会怎样" },
      { title: "人际信任判断", desc: "对方是否可信 · 是否值得交往" },
    ],
  },
  {
    name: "事业学业",
    topics: [
      { title: "是否能入职", desc: "是否有机会录用 · 能否顺利入职" },
      { title: "Offer选择", desc: "哪个更合适 · 如何做出选择" },
      { title: "工作发展", desc: "前景如何 · 是否有发展空间" },
      { title: "升职判断", desc: "是否有机会晋升 · 能否提升职位" },
      { title: "是否换工作", desc: "是否适合跳槽 · 现在是否应改变" },
      { title: "考试结果", desc: "是否能通过 · 结果是否理想" },
      { title: "升学选择", desc: "选哪个更好 · 是否适合这个方向" },
    ],
  },
  {
    name: "财运投资",
    topics: [
      { title: "财运走势", desc: "最近财运如何 · 收入变化趋势" },
      { title: "投资判断", desc: "是否适合投入 · 风险与机会如何" },
      { title: "项目盈利", desc: "能否赚钱 · 收益情况如何" },
      { title: "创业判断", desc: "是否适合创业 · 成功概率如何" },
    ],
  },
  {
    name: "合作事务",
    topics: [
      { title: "是否合作", desc: "是否适合合作 · 是否值得推进" },
      { title: "合作能否成功", desc: "能否谈成 · 合作是否顺利" },
      { title: "合作结果", desc: "合作后发展如何 · 结果是好是坏" },
    ],
  },
  {
    name: "风险问题",
    topics: [
      { title: "是否有风险", desc: "是否存在隐患 · 是否需要谨慎" },
      { title: "官司诉讼", desc: "是否有利 · 结果走向如何" },
      { title: "是否被骗", desc: "是否存在欺骗 · 是否会受损" },
      { title: "事情发展结果", desc: "最终会如何发展 · 结果是好是坏" },
    ],
  },
  {
    name: "健康状态",
    topics: [
      { title: "健康状况", desc: "当前身体情况 · 是否存在问题" },
      { title: "疾病发展", desc: "是否会加重 · 后续变化如何" },
    ],
  },
  {
    name: "通用决策",
    topics: [
      { title: "是否可行", desc: "这件事能不能做 · 成功可能性如何" },
      { title: "是否继续", desc: "是否应该坚持 · 是否值得继续" },
      { title: "是否选择", desc: "哪个更合适 · 如何做出选择" },
    ],
  },
];

export interface IChingSelection {
  category: string;
  topic: IChingTopic;
}
