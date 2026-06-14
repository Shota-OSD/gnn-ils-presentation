// ============================================================
  // Global Data
  // ============================================================

  const NSFNET = {
    nodes: [
      { id: 0,  label: "1",  x: 100, y: 100 },
      { id: 1,  label: "2",  x: 60,  y: 250 },
      { id: 2,  label: "3",  x: 80,  y: 350 },
      { id: 3,  label: "4",  x: 220, y: 200 },
      { id: 4,  label: "5",  x: 300, y: 250 },
      { id: 5,  label: "6",  x: 380, y: 400 },
      { id: 6,  label: "7",  x: 400, y: 180 },
      { id: 7,  label: "8",  x: 500, y: 200 },
      { id: 8,  label: "9",  x: 580, y: 140 },
      { id: 9,  label: "10", x: 580, y: 350 },
      { id: 10, label: "11", x: 660, y: 170 },
      { id: 11, label: "12", x: 790, y: 95 },
      { id: 12, label: "13", x: 780, y: 250 },
      { id: 13, label: "14", x: 690, y: 365 },
    ],
    edges: [
      { source: 0, target: 1, capacity: 10 },
      { source: 0, target: 3, capacity: 10 },
      { source: 0, target: 8, capacity: 10 },
      { source: 1, target: 2, capacity: 10 },
      { source: 1, target: 3, capacity: 10 },
      { source: 2, target: 5, capacity: 10 },
      { source: 3, target: 4, capacity: 10 },
      { source: 3, target: 6, capacity: 10 },
      { source: 4, target: 5, capacity: 10 },
      { source: 4, target: 6, capacity: 10 },
      { source: 5, target: 9, capacity: 10 },
      { source: 5, target: 13, capacity: 10 },
      { source: 6, target: 7, capacity: 10 },
      { source: 7, target: 8, capacity: 10 },
      { source: 7, target: 9, capacity: 10 },
      { source: 7, target: 10, capacity: 10 },
      { source: 8, target: 11, capacity: 10 },
      { source: 9, target: 12, capacity: 10 },
      { source: 9, target: 13, capacity: 10 },
      { source: 10, target: 11, capacity: 10 },
      { source: 10, target: 12, capacity: 10 },
    ],
  };

  const demoSmall = {
    nodes: [
      { id: 0, label: "A", x: 100, y: 170 },
      { id: 1, label: "B", x: 280, y: 60 },
      { id: 2, label: "C", x: 280, y: 280 },
      { id: 3, label: "D", x: 480, y: 60 },
      { id: 4, label: "E", x: 480, y: 280 },
      { id: 5, label: "F", x: 680, y: 170 },
    ],
    edges: [
      { source: 0, target: 1, capacity: 10 },
      { source: 0, target: 2, capacity: 10 },
      { source: 1, target: 2, capacity: 10 },
      { source: 1, target: 3, capacity: 10 },
      { source: 1, target: 4, capacity: 10 },
      { source: 2, target: 4, capacity: 10 },
      { source: 3, target: 5, capacity: 10 },
      { source: 4, target: 5, capacity: 10 },
      { source: 3, target: 4, capacity: 10 },
    ],
    commodities: [
      { id: 0, src: 0, dst: 5, demand: 4, color: "#e74c3c" },
      { id: 1, src: 0, dst: 3, demand: 5, color: "#3498db" },
      { id: 2, src: 2, dst: 5, demand: 4, color: "#2ecc71" },
    ],
    shortestPaths: [
      [0, 1, 3, 5],
      [0, 1, 3],
      [2, 4, 5],
    ],
    balancedPaths: [
      [0, 2, 4, 5],
      [0, 1, 3],
      [2, 1, 4, 3, 5],
    ],
  };

  const improvementSteps = [
    {
      step: 0,
      description: "初期状態: 全てのデータが最短ルートを使用中。リンク 4→7 と 7→8 に集中して大渋滞！",
      maxUtil: 1.35,
      flows: [
        { id: 0, color: "#e74c3c", label: "データ1", path: [0, 3, 6, 7, 10, 11], demand: 3 },
        { id: 1, color: "#3498db", label: "データ2", path: [1, 3, 6, 7, 8],      demand: 4 },
        { id: 2, color: "#2ecc71", label: "データ3", path: [2, 5, 9, 13],        demand: 3 },
        { id: 3, color: "#f39c12", label: "データ4", path: [0, 3, 4, 5, 9, 12],  demand: 2 },
        { id: 4, color: "#9b59b6", label: "データ5", path: [1, 3, 6, 7, 10, 12], demand: 3 },
      ],
      changedFlow: null,
    },
    {
      step: 1,
      description: "AIが観察: 「4→7 が超混雑！」\nデータ5（紫）のルートを南回りに変更",
      maxUtil: 1.05,
      flows: [
        { id: 0, color: "#e74c3c", label: "データ1", path: [0, 3, 6, 7, 10, 11], demand: 3 },
        { id: 1, color: "#3498db", label: "データ2", path: [1, 3, 6, 7, 8],      demand: 4 },
        { id: 2, color: "#2ecc71", label: "データ3", path: [2, 5, 9, 13],        demand: 3 },
        { id: 3, color: "#f39c12", label: "データ4", path: [0, 3, 4, 5, 9, 12],  demand: 2 },
        { id: 4, color: "#9b59b6", label: "データ5", path: [1, 2, 5, 9, 12],     demand: 3 },
      ],
      changedFlow: { id: 4, oldPath: [1, 3, 6, 7, 10, 12] },
    },
    {
      step: 2,
      description: "AIが観察: 「まだ 7→8 が混んでる」\nデータ1（赤）を東側経由に変更",
      maxUtil: 0.90,
      flows: [
        { id: 0, color: "#e74c3c", label: "データ1", path: [0, 8, 11],           demand: 3 },
        { id: 1, color: "#3498db", label: "データ2", path: [1, 3, 6, 7, 8],      demand: 4 },
        { id: 2, color: "#2ecc71", label: "データ3", path: [2, 5, 9, 13],        demand: 3 },
        { id: 3, color: "#f39c12", label: "データ4", path: [0, 3, 4, 5, 9, 12],  demand: 2 },
        { id: 4, color: "#9b59b6", label: "データ5", path: [1, 2, 5, 9, 12],     demand: 3 },
      ],
      changedFlow: { id: 0, oldPath: [0, 3, 6, 7, 10, 11] },
    },
    {
      step: 3,
      description: "AIが観察: 「6→10 に少し集中」\nデータ4（橙）を北回りに変更",
      maxUtil: 0.82,
      flows: [
        { id: 0, color: "#e74c3c", label: "データ1", path: [0, 8, 11],           demand: 3 },
        { id: 1, color: "#3498db", label: "データ2", path: [1, 3, 6, 7, 8],      demand: 4 },
        { id: 2, color: "#2ecc71", label: "データ3", path: [2, 5, 9, 13],        demand: 3 },
        { id: 3, color: "#f39c12", label: "データ4", path: [0, 3, 6, 7, 9, 12],  demand: 2 },
        { id: 4, color: "#9b59b6", label: "データ5", path: [1, 2, 5, 9, 12],     demand: 3 },
      ],
      changedFlow: { id: 3, oldPath: [0, 3, 4, 5, 9, 12] },
    },
    {
      step: 4,
      description: "AIが微調整: データ2（青）を少し迂回させてさらに分散",
      maxUtil: 0.75,
      flows: [
        { id: 0, color: "#e74c3c", label: "データ1", path: [0, 8, 11],           demand: 3 },
        { id: 1, color: "#3498db", label: "データ2", path: [1, 3, 4, 6, 7, 8],   demand: 4 },
        { id: 2, color: "#2ecc71", label: "データ3", path: [2, 5, 9, 13],        demand: 3 },
        { id: 3, color: "#f39c12", label: "データ4", path: [0, 3, 6, 7, 9, 12],  demand: 2 },
        { id: 4, color: "#9b59b6", label: "データ5", path: [1, 2, 5, 9, 12],     demand: 3 },
      ],
      changedFlow: { id: 1, oldPath: [1, 3, 6, 7, 8] },
    },
    {
      step: 5,
      description: "完了！ 混雑度が 135% → 75% に改善。全リンクが容量内に収まりました！",
      maxUtil: 0.75,
      flows: null,
      changedFlow: null,
    },
  ];

  const resultsData = [
    { label: "5",  value: 89.2 },
    { label: "10", value: 96.4 },
    { label: "15", value: 89.8 },
    { label: "20", value: 88.2 },
    { label: "25", value: 87.6 },
  ];
