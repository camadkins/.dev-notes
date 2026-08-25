---
title: I/O Devices and Drivers
description: How the kernel talks to hardware - polling, interrupts, and DMA as three answers to who waits, plus what a driver actually is.
draft: false
comments: true
tags:
  - cs
  - systems
  - computer-architecture
date: 2026-01-19
updated:
aliases:
  - Device Drivers
  - Direct Memory Access
---

Devices are slow, and the CPU is not. Every mechanism in this note exists because of that gap, and each one is a different answer to the same question: who does the waiting, and what do they do while they wait? Polling says the CPU waits and does nothing. Interrupts say the CPU leaves and comes back when summoned. DMA says the CPU does not participate in the transfer at all. Those three form a progression, and each step buys CPU time by adding hardware and complexity.

> [!note] The idea
> A driver is not primarily a translator of commands; it is a negotiator of waiting. The interface a driver presents upward is deliberately boring, since a driver "provides a software interface to hardware devices, enabling other software to access hardware functions without needing to know precise details about the hardware." What varies enormously beneath that interface is how the device signals readiness, and that choice, not the command set, is what determines whether a machine spends its cycles computing or spinning.

## What a driver is

The definition is short. "A device driver is software that operates or controls a particular type of device that is attached to a computer." Structurally, "a driver communicates with the device through the computer bus or communications subsystem to which the hardware connects. When a calling program invokes a routine in the driver, the driver issues commands to the device (drives it). Once the device sends data back to the driver, the driver may invoke routines in the original calling program."

That last clause is the shape of asynchrony hiding in a one-line definition. Control does not simply flow down and return. It flows down, and then later flows back up from the device side. Which is why "drivers... usually provide the interrupt handling required for any necessary asynchronous time-dependent hardware interface."

The purpose is abstraction: "the main purpose of device drivers is to provide hardware abstraction by acting as a translator between a hardware device and the applications or operating systems that use it," so that "programmers can write higher-level application code independently of whatever specific hardware the end-user is using."

The article's own example is the cleanest illustration of what that buys. "A high-level application for interacting with a serial port may simply have two functions for *send data* and *receive data*. At a lower level, a device driver implementing these functions would communicate with the particular serial port controller installed on a user's computer. The commands needed to control a 16550 UART are much different from the commands needed to control a USB-to-serial adapter, but each hardware-specific device driver abstracts these details into the same (or similar) software interface." Two radically different pieces of silicon, one interface. That interface is the driver's entire product.

Note also that "drivers are [[cs/languages/common/portability-and-cross-compilation|hardware-dependent and operating-system-specific]]," which is why the driver matrix is a cross product rather than a list, and why a driver is written twice for two operating systems.

## Polling: the CPU waits

Polling "refers to actively sampling the status of an external device by a client program as a synchronous activity," and is "also referred to as polled I/O or software-driven I/O." Concretely, it "is the process where the computer or controlling device waits for an external device to check for its readiness or state, often with low-level hardware. For example, when a printer is connected via a parallel port, the computer waits until the printer has received the next character."

There are two distinct behaviors under the one name, and conflating them is a common error. Busy-wait polling is the extreme: "when an I/O operation is required, the computer does nothing other than check the status of the I/O device until it is ready, at which point the device is accessed." The gentler version is periodic: "polling also refers to the situation where a device is repeatedly checked for readiness, and if it is not, the computer returns to a different task." The verdict on the second: "although not as wasteful of CPU cycles as busy waiting, this is generally not as efficient as the alternative to polling, interrupt-driven I/O."

Polling is not always wrong. "In a simple single-purpose system, even busy-wait is perfectly appropriate if no action is possible until the I/O access, but more often than not this was traditionally a consequence of simple hardware or non-multitasking operating systems." If there is genuinely nothing else to run, spinning costs nothing real.

The failure mode is one of scale: "polling has the disadvantage that if there are too many devices to check, the time required to poll them can exceed the time available to service the I/O device." Add devices and eventually the checking outruns the servicing.

> [!example] The handshake, in registers
> Polling looks abstract until you see the actual protocol, which is a four-register conversation.
>
> The host: "repeatedly reads the busy bit of the controller until it becomes clear (with a value of 0)." Then, "when clear, the host writes the command into the command register. If the host is sending output, it sets the write bit and writes a byte into the data-out register. If the host is receiving input, it reads the controller-written data from the data-in register." Finally "the host sets the command-ready bit to 1."
>
> The controller: "when the controller notices that the command-ready bit is set, it sets the busy bit to 1." It "reads the command register. If the write bit inside is set, it reads from the data-out register and performs the necessary I/O operations on the device. If the read bit is set, data from the device is loaded into the data-in register for the host to read." When finished, "the controller clears the command-ready bit, clears the error bit to show the operation was successful, and clears the busy bit."
>
> Count the bytes moved per round trip: one. That is the number to hold onto when DMA shows up below.

How low-level is this really? "Polling a parallel printer port to check whether it is ready for another character involves examining as little as one bit of a byte. That bit represents, at the time of reading, whether a single wire in the printer cable is at low or high voltage. The I/O instruction that reads this byte directly transfers the voltage state of eight real world wires to the eight circuits ([[cs/history/shannon-boolean-algebra-switching|flip flops]]) that make up one byte of a CPU register." Eight wires, eight flip-flops, one register. There is no abstraction left at that layer, which is precisely why the driver exists above it.

Polling also generalizes past device I/O. A **polling cycle** is "the time in which each element is monitored once," and "the optimal polling cycle will vary according to several factors, including the desired speed of response and the overhead (e.g., processor time and bandwidth) of the polling." In **roll call polling** "the polling device or process queries each element on a list in a fixed sequence," which "can be inefficient if the overhead for the polling messages is high, there are numerous elements to be polled in each polling cycle and only a few elements are active." In **hub polling**, "also referred to as token polling, each element polls the next element in some fixed sequence."

## Interrupts: the device summons the CPU

The alternative is for the device to signal the CPU rather than the CPU to ask. Interrupt-driven I/O is what polling is measured against, and drivers are where the handling lives, since drivers "usually provide the interrupt handling required for any necessary asynchronous time-dependent hardware interface." The mechanics of delivery, vectoring, and handler execution are their own subject, covered in [[cs/systems/interrupts-and-traps|interrupts and traps]].

What matters here is that interrupts fix the *waiting* problem without fixing the *transfer* problem. The CPU is now free between events, but it still executes every data movement itself, one unit at a time, in the handler. For a keyboard that is fine. For a gigabit network card it is not.

## DMA: the CPU steps out of the data path

"Direct memory access (DMA) is a feature of many computer systems that allows certain hardware subsystems to access main system memory independently of the central processing unit (CPU)."

The contrast with everything above is stated exactly: "without DMA, programmed input-output must be used to transfer data which typically fully occupies the CPU for the entire duration of the transfer, and is thus unavailable to perform other work. With DMA, the CPU first initiates the transfer, then it does other operations while the transfer is in progress, and it finally receives an interrupt from the direct memory access controller (DMAC) when the operation is done."

The CPU's involvement collapses from "every byte" to "two events, one at each end." DMA "is useful at any time that the CPU cannot keep up with the rate of data transfer, or when the CPU needs to perform work while waiting for a relatively slow data transfer," and the payoff is that machines with DMA "can transfer data to and from devices with much less CPU overhead than computers without DMA." The devices using it are the high-throughput ones you would guess: "disk drive controllers, graphics cards, network cards, sound cards and dedicated DMA controllers."

Setup is a small ritual. "The host processor initializes the DMA controller with a count of the number of words to transfer, and the memory address to use. The CPU then commands the peripheral device to initiate a data transfer. The DMA controller then provides addresses and read/write control lines to the system memory. Each time a byte of data is ready to be transferred between the peripheral device and memory, the DMA controller increments its internal address register until the full block of data is transferred." The controller "can generate memory addresses and initiate memory read or write cycles" and holds "a memory address register, a count register, and one or more control registers."

There are two structural arrangements. Third-party DMA is the classic one, where a dedicated DMA controller does the work. In bus mastering, "also known as a first-party DMA system, the CPU and peripherals can each be granted control of the memory bus. Where a peripheral can become a bus master, it can directly write to system memory without the involvement of the CPU, providing memory address and control signals as required." The catch is arbitration: "some measures must be provided to put the processor into a hold condition so that bus contention does not occur."

### Who gets the bus, and for how long

Because the DMA controller and the CPU contend for one memory bus, the transfer policy is a real design axis:

| Mode | Behavior | Cost |
|------|----------|------|
| Burst | "An entire block of data is transferred in one contiguous sequence," holding the bus until done | "Renders the CPU inactive for relatively long periods of time" |
| Cycle stealing | Bus released after "one unit of data transfer" and re-requested, "transferring one unit of data per request, until the entire block of data has been transferred" | "Data is not transferred as quickly, but the CPU is not idled for as long as in burst mode" |
| Transparent | "The DMA controller transfers data only when the CPU is performing operations that do not use the system buses" | "Takes the most time to transfer a block of data"; "the hardware needs to determine when the CPU is not using the system buses, which can be complex" |

Cycle stealing "essentially interleaves instruction and data transfers. The CPU processes an instruction, then the DMA controller transfers one data value, and so on," and it "is useful for controllers that monitor data in real time." Transparent mode is the one with the surprising property: it "is also the most efficient mode in terms of overall system performance," since "the CPU never stops executing its programs, and the DMA transfer is free in terms of time." Slowest transfer, fastest system. That inversion is only strange if you were measuring the wrong thing.

> [!warning] DMA breaks your cache's assumptions
> "DMA can lead to cache coherency problems." The scenario: "when the CPU accesses location X in the memory, the current value will be stored in the cache. Subsequent operations on X will update the cached copy of X, but not the external memory version of X, assuming a write-back cache. If the cache is not flushed to the memory before the next time a device tries to access X, the device will receive a stale value of X." The mirror-image failure also holds: "if the cached copy of X is not invalidated when a device writes a new value to the memory, then the CPU will operate on a stale value of X."
>
> Two fixes, and which one you get is a property of the machine. "Cache-coherent systems implement a method in hardware, called bus snooping, whereby external writes are signaled to the cache controller which then performs a cache invalidation for DMA writes or cache flush for DMA reads." Otherwise it lands on you: "non-coherent systems leave this to software, where the OS must then ensure that the cache lines are flushed before an outgoing DMA transfer is started and invalidated before a memory range affected by an incoming DMA transfer is accessed. The OS must make sure that the memory range is not accessed by any running threads in the meantime."
>
> The software path is not cheap: it "introduces some overhead to the DMA operation, as most hardware requires a loop to invalidate each cache line individually." Hybrids exist too, "where the secondary L2 cache is coherent while the L1 cache (typically on-CPU) is managed by software." This is [[cs/systems/cache-coherence|cache coherence]] arriving from an unexpected direction, since the incoherent party is a peripheral rather than another core.

## Where drivers run

Privilege placement is not a driver-by-driver decision. It "is largely decided by the type of kernel an operating system uses. An operating system that uses a monolithic kernel, such as the Linux kernel, will typically run device drivers with the same privilege as all other kernel objects. By contrast, a system designed around microkernel, such as Minix, will run drivers as processes independent from the kernel." That is the [[cs/systems/kernel-architectures-monolithic-and-microkernel|monolithic versus microkernel]] split showing up as a concrete consequence.

Even so, "because drivers require low-level access to hardware functions in order to operate, drivers typically operate in a highly privileged environment and can cause system operational issues if something goes wrong. In contrast, misbehavior in most user-level software on modern operating systems can be stopped without greatly affecting the rest of the system." And user mode is not a complete escape, because "even drivers executing in user mode can crash a system if the device is erroneously programmed."

Vendors and OS authors split the work. "Typically, the hardware abstraction portion of the driver is written by the operating system vendor, while the lower-level physical device access portion is implemented by the device vendor." Windows formalizes this as "a combination of driver and minidriver, where the full class/port driver is provided with the operating system, and miniclass/miniport drivers are developed by vendors and implement hardware- or function-specific subset of the full driver stack." Microsoft's response to driver-induced instability was Windows Driver Frameworks, including "User-Mode Driver Framework (UMDF) that encourages development of certain types of drivers, primarily those that implement a message-based protocol for communicating with their devices, as user-mode drivers. If such drivers malfunction, they do not cause system instability." Apple's equivalent framework is I/O Kit. On Linux, "programmers can build device drivers as parts of the kernel, separately as loadable modules, or as user-mode drivers for certain types of devices where kernel interfaces exist, such as for USB devices."

Writing them is genuinely hard, and not only technically: "writing a device driver requires an in-depth understanding of how the hardware and the software work for a given platform function," and the privileged environment makes it "more difficult and dangerous to diagnose problems." The work "usually falls to software or computer engineers who work for hardware-development companies" because "they have better information than most outsiders about the design of the hardware." When outsiders write drivers for free and open source operating systems, "it is important that the hardware manufacturer provide information on how the device communicates," since although the information "can instead be learned by reverse engineering, this is much more difficult with hardware than it is with software."

> [!tip] The security shape of all this
> "Computers often have many diverse and customized device drivers running in their operating system kernel, which often contain various bugs and vulnerabilities, making them a target for exploits." The named attack pattern is worth knowing: "a *Bring Your Own Vulnerable Driver* (BYOVD) attacker installs any signed, old third-party driver with known vulnerabilities that allow malicious code to be inserted into the kernel." Signed does not mean safe; it means signed. Compounding it, "there is a lack of effective kernel vulnerability detection tools, especially for closed-source operating systems such as Microsoft Windows where the source code of the device drivers is mostly proprietary and not available to examine, and drivers often have many privileges." One measure of the churn involved: a group of security researchers who published a kernel isolation framework say Linux drivers "get ~80,000 commits per year."

## Related Notes

- [[cs/systems/interrupts-and-traps|Interrupts and Traps]] - the signaling mechanism that replaced polling and that DMA uses for completion
- [[cs/systems/kernel-architectures-monolithic-and-microkernel|Kernel Architectures]] - the design decision that sets driver privilege level
- [[cs/systems/cache-coherence|Cache Coherence]] - the same staleness problem, here caused by a device rather than a core
- [[cs/systems/system-calls-and-the-kernel-boundary|System Calls and the Kernel Boundary]] - how a program reaches the driver in the first place
- [[cs/systems/file-systems|File Systems]] - the layer built on top of block device drivers
- [[cs/systems/concurrency-primitives|Concurrency Primitives]] - busy-waiting appears here too, with the same trade

## Sources

- "Device driver," Wikipedia. https://en.wikipedia.org/wiki/Device_driver . Backs the definition of a driver and its bus communication and call-return structure, hardware dependence and OS specificity, interrupt handling responsibility, the hardware-abstraction purpose and the 16550 UART versus USB-to-serial example, the privileged-environment risk and the user-mode-driver caveat, the monolithic versus microkernel privilege placement with Linux and Minix, the OS-vendor/device-vendor split and Windows minidriver model, WDF/UMDF and I/O Kit, Linux driver build options, the difficulty of writing and reverse engineering drivers, and the security discussion including BYOVD, closed-source detection difficulty, and the ~80,000 commits per year figure attributed to the isolation researchers.
- "Polling (computer science)," Wikipedia. https://en.wikipedia.org/wiki/Polling_%28computer_science%29 . Backs the definition of polling as synchronous status sampling and the polled/software-driven I/O naming, the printer parallel-port example, the busy-wait versus periodic-check distinction and their relative efficiency against interrupt-driven I/O, the single-purpose-system justification, the too-many-devices failure mode, the full host and controller register handshake algorithm, the one-bit/eight-wire low-level description, and the polling cycle, roll call polling, and hub polling definitions.
- "Direct memory access," Wikipedia. https://en.wikipedia.org/wiki/Direct_memory_access . Backs the DMA definition, the programmed-I/O contrast and the initiate/work/interrupt sequence, the usefulness conditions and reduced CPU overhead, the list of DMA-using hardware, the DMA controller's registers and the initialization and transfer procedure, third-party versus bus-mastering DMA and the bus-contention caveat, the burst, cycle stealing, and transparent mode descriptions and their trade-offs, and the cache coherency problem with the bus-snooping hardware fix, the software flush/invalidate path and its per-cache-line loop overhead, and the L2-coherent hybrid.
