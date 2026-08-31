# Ubuntu VM CLI Access

Updated: 2026-08-31

## SSH connection

- Host: `127.0.0.1`
- Port: `2222`
- User: `lzdz`
- Password: intentionally not stored in this repository
- Direct command: `ssh lzdz@127.0.0.1 -p 2222`

The local convenience script is `D:\实习\一键连接Ubuntu命令行.bat`.
The repository copy is `tools\connect-ubuntu-ssh.bat`.
Both scripts start the VM in headless mode when needed and then open SSH.

## Current VM state

- Ubuntu 20.04.3 is reachable over SSH.
- `ssh` is active inside the guest.
- The default systemd target is `multi-user.target`.
- `gdm3` is stopped so the unstable graphical session does not consume CPU.
- To restore graphical boot later, run:

```bash
sudo systemctl set-default graphical.target
sudo systemctl start gdm3
```

## GUI diagnosis

The guest X11 session repeatedly crashed `gnome-shell` with `SIGILL` while
running under this Windows host and VirtualBox 6.1.32. The failing stack
included Mesa/LLVM software-rendering code. JIT and Xorg workarounds were
already present, but the GUI remained unreliable. The project therefore uses
SSH and terminal tools as the primary workflow.

## Source search

As of 2026-08-31, neither `ohos-training` nor `station_cloud` was found in
the `D:\实习` workspace or in the Ubuntu guest filesystem.
