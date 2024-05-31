---
title: 疑难杂症 记录
date: 2024-01-30
description: solutions for complications
categories: 
  - Misc
image: 
---

记录各种疑难杂症又不是很系统的问题的解决方法

## # 1. ZoneIdentifier feature disable

Show up when files are copied from windows to wsl2.

> See [here](https://github.com/LukeShortCloud/rootpages/issues/1016).

## # 2. VSC c_cpp include error

Some annoying and puzzling(?) #include errors detected in vscode.

Try CLOSE then REOPEN the vsc first, if not help:

> See [here](https://stackoverflow.com/questions/45583473/include-errors-detected-in-vscode/68139743#68139743).


## # 3. network unreachable on a new linux machine

Check if you have the dhcp offer to access the network.

Just run `sudo dhclient xxx(adapter name)` to get the dhcp offer (including the IP address for adapter, gateway and the DNS server address).

But you would need to rerun the command every time when you boot the machine. A betterr way is to add the following content into `/etc/netplan/xxx.yaml`:


```sh
network:
  version: 2
  ethernets:
    xxx(adapter name):
      dhcp4: true
```

For me, my linux machine is a virtual machine running on the *Oracle VM VirtualBox*, and the network setting in VirtualBox is:

- adapter 1 (eth0): Host only
- adapter 2 (eth1): NAT

The eth0 is used for ssh connection from host, and eth1 is used for access the internet. So the config in netplan yaml is:

```
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: true
    eth1:
      dhcp4: true
```

