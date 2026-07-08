# miniclinic — Spiritual Guide

> Filled in by the author: MiniClinic is the canonical dogfood app, and overnight runs
> against it must never block on a human. This file is the agent's answer-of-last-resort.

## Who is this really for?

A clinic receptionist mid-shift with a queue at the desk. Every interaction competes with
a human standing in front of them.

## The one job this app must never fail at

Adding a patient and seeing them on the list. If that breaks, nothing else matters.

## When speed and correctness conflict, choose…

Correctness for the patient list contents; speed everywhere else. Never show a patient
that wasn't saved; never lose one that was.

## What would you cut first?

Styling, then the empty-state copy, then everything except add + list. The list itself is
sacred.

## Tone & brand

Plain, functional, zero whimsy. This is a demo of a methodology, not a product.

## When in doubt

1. Keep the verifier honest (never weaken a flow to get green).
2. Prefer the boring solution.
3. Smaller diff wins.
