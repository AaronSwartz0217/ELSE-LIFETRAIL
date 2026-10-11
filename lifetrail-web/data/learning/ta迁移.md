# 技术美术（TA）迁移

## 目标
把已有的 ShaderToy → ShaderLab/GLSL 工作流整体迁到 UE5，形成能写进简历、能对接美术与程序的技术美术能力。

## 步骤
- [x] ShaderToy 找代码 → 转 ShaderLab 的 CG 语义块 / GLSL
- [~] UE5 材质 Custom 节点：输入输出/数组手动增删、内置函数、return
- [~] RT（Render Target）→ 后处理材质链路
- [ ] 把 RT 结果渲染到 GBuffer / 后处理体积
- [ ] 插件层开发：蓝图 → C++，做便于美术取用的工具流
- [ ] 作品集配套：浅水方程 / 鸟群算法 / Niagara 粒子 / 特殊交互 / DX12

## 坑
- ush（Unreal Engine Shader Head）要放在 UE5 工程外的 shader 目录，蓝图无法被 VS/rider 直接识别
- 纯蓝图跑这套前期成本高；要么蓝图+C++，要么纯 C++
- Custom 节点做不了 ush 那种「蜘蛛网」函数封装，复杂逻辑仍需 ush

## 依据
- 2026-10-11 · 技术美术迁移与预算
- 2026-10-12 · UE5技术美术架构总结

## 下一步
- 先在 Custom 节点搭出最小架构，再把 RT 后处理串起来
- 顺带跟进 DLSS5 用法（10-11 评论）