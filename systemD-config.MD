That is a great setup for separating your personal work (mosgarage) from your automation or service tasks (devops). Since you are on WSL (Windows Subsystem for Linux), the approach is slightly different than a standard Linux server because WSL doesn't run a traditional systemd init system by default (though newer versions of Windows 11/WSL2 do support it).
Here is how you can set this up to switch easily and use the devops account for services:
1. Switching Between Users Interchangeably
You don't need to restart WSL to switch users. You can simply use the su (switch user) command from within your terminal.

    To switch to the devops user:

    bash
    1

    (The - ensures you load the devops user's environment variables and home directory. You will be prompted for the devops password.)
    To switch back to mosgarage:

    bash
    1

    (Or press Ctrl+D)

Pro Tip for Easy Access:
If you want to launch a terminal window directly as the devops user without typing the command every time, you can create a shortcut in Windows:

    Right-click your desktop -> New -> Shortcut.
    Target: wsl -u devops
    Name it "WSL DevOps".
    Now you can just double-click that icon to drop straight into the devops account.

2. Using devops as a System Services Account
This depends on which version of WSL you are running.
Scenario A: You are on WSL2 with systemd enabled (Recommended for modern setups)
If your WSL distribution supports systemd (common in Ubuntu 22.04+ on Windows 11), you can create actual system services just like on a real server.

    Enable systemd (if not already):
    Create or edit /etc/wsl.conf as root:

    bash
    1

    Add these lines:

    ini
    1
    2

    Restart WSL from PowerShell: wsl --shutdown then reopen your terminal.
    Create a Service File:
    As root, create a service file (e.g., /etc/systemd/system/my-service.service):

    ini
    1
    2
    3
    4
    5
    6
    7
    8
    9
    10
    11
    12
    13
    14

    Note the User=devops line. This runs the service specifically under that account.
    Activate it:

    bash
    1
    2
    3

Scenario B: You are on an older WSL version (No systemd)
If systemctl gives you an error, WSL isn't running systemd. In this case, "system services" are usually handled by cron or a startup script in your .bashrc, though they won't persist exactly like a daemon if the WSL instance stops.

    Using Cron (for scheduled tasks):
    Edit the crontab for the devops user:

    bash
    1

    Add your job there. It will run as devops.
    Running a background process manually:
    If you need a long-running process, you can start it using nohup while logged in as devops:

    bash
    1
    2

    (Note: If you shut down WSL, this process will stop. For true persistence without systemd, many users prefer running the service as a Windows Service that executes wsl -u devops ...).

Summary Checklist for You

    Verify Passwords: Ensure both mosgarage and devops have passwords set (sudo passwd devops).
    Test Switching: Run su - devops to confirm it works.
    Check Systemd: Run systemctl --version. If it works, follow Scenario A. If it fails, follow Scenario B or consider enabling systemd via /etc/wsl.conf.

Would you like me to help you write the specific service file for a tool you are planning to run (like Node, Python, or Nginx)?
