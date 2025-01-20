<p align="center">
  <a href="https://github.com/Geocld/PeaSyo">
    <img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/logo.png" width="100">
  </a>
</p>
<p align="center">
  <a href="https://github.com/Geocld/PeaSyo">
    <img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/logo-text.png" width="300">
  </a>
</p>

<p align="center">
  为Android端打造的下一代PS4/PS5串流客户端。
</p>

## Intro

PeaSyo，也称貔貅（pixiu），使用中国古代神兽命名，是一款为PS4/5串流应用，支持远程唤醒、远程串流、按键映射、手柄振动等丰富的功能，你可以在任意Android设备上使用貔貅游玩PlayStation游戏。


> 声明: PeaSyo与Sony、PlayStation没有关联。所有权和商标属于其各自所有者。

> 注意: 如果你使用貔貅串流PS4，你的主机系统固件版本需要升级到8+。

## 功能

- 支持多主机注册
- 支持本地串流和远程串流(需配置网关)
- 最高支持1080P，支持HDR
- 支持按键映射
- 支持串流性能查看
- 支持快捷菜单
- 远程唤醒及休眠

<img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/game.jpg" width="400" />
<img src="https://github.com/Geocld/PeaSyo/blob/main/images/home.jpg" width="400" /><img src="https://raw.githubusercontent.com/Geocld/PeaSyo/main/images/settings.jpg" width="400" />

## 接下来的计划
PeaSyo基于[Chiaki](https://git.sr.ht/~thestr4ng3r/chiaki)连接协议，其他功能均重新实现，接下来的计划是使用Rust将原chiaki的协议部分进行全部重构。

## 本地开发

### 环境要求
- [React Native](https://reactnative.dev/) >= 0.74
- [NodeJs](https://nodejs.org/) >= 20
- [Yarn](https://yarnpkg.com/) >= 1.22

### 运行项目

克隆本项目到本地:

```
git clone https://github.com/Geocld/PeaSyo
cd PeaSyo
```
安装依赖:

```
yarn
```

启动开发模式:

```
npm run android
```


## 开源协议

PeaSyo 严格遵循 [AGPL v3 协议](./LICENSE)，如其他项目借鉴本项目实现，请严格遵循此协议。