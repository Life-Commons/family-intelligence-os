export function startStory(card) {
  const el = (id) => document.getElementById(id),
    status = (text) => {
      el("rec-status").textContent = text;
    };
  el("question").textContent = card.title;
  el("cue").textContent = card.intro;
  let recorder,
    stream,
    stopTimer,
    timer,
    url,
    file,
    pending = false,
    unsaved = false,
    generation = 0;
  function release() {
    clearTimeout(stopTimer);
    clearInterval(timer);
    if (stream) for (const track of stream.getTracks()) track.stop();
    stream = null;
  }
  function clearDraft() {
    if (url) URL.revokeObjectURL(url);
    url = null;
    file = null;
    unsaved = false;
    el("audio").removeAttribute("src");
    el("audio").load();
    el("audio").hidden = true;
    el("review").hidden = true;
    el("download").removeAttribute("href");
    el("stage").textContent = "Tell it in your own words.";
    el("record").hidden = false;
    el("record").disabled = false;
  }
  function stop() {
    if (recorder?.state === "recording") {
      el("stop").disabled = true;
      recorder.stop();
    }
  }
  function finish(parts, type, failed) {
    release();
    recorder = null;
    el("stop").hidden = true;
    el("stop").disabled = false;
    const blob = new Blob(parts, { type });
    if (!blob.size) {
      clearDraft();
      status("No audio was captured. Try again or write your story.");
      return;
    }
    const ext = type.includes("mp4")
      ? "m4a"
      : type.includes("ogg")
        ? "ogg"
        : "webm";
    file = new File([blob], "sunday-story." + ext, { type });
    url = URL.createObjectURL(file);
    unsaved = true;
    el("audio").src = url;
    el("audio").hidden = false;
    el("download").href = url;
    el("download").download = file.name;
    el("share").hidden = !(
      navigator.canShare && navigator.canShare({ files: [file] })
    );
    el("review").hidden = false;
    el("stage").textContent = "Listen to your story.";
    status(
      failed
        ? "Recording was interrupted. Review the part that was captured."
        : "Recording stopped. Press play to review your take.",
    );
  }
  const canRecord = !!(
    navigator.mediaDevices?.getUserMedia && window.MediaRecorder
  );
  if (!canRecord) {
    el("record").disabled = true;
    status(
      "Recording is unavailable in this browser. Use the writing option below.",
    );
  }
  el("record").onclick = async () => {
    if (pending || recorder || file) return;
    pending = true;
    el("record").disabled = true;
    const turn = ++generation;
    window.speechSynthesis?.cancel();
    status("Allow microphone access to start your recording.");
    try {
      const source = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation !== turn) {
        source.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = source;
      const r = new MediaRecorder(stream);
      recorder = r;
      const parts = [];
      let failed = false;
      r.ondataavailable = (e) => {
        if (e.data.size) parts.push(e.data);
      };
      r.onerror = () => {
        failed = true;
        stop();
      };
      r.onstop = () =>
        finish(parts, r.mimeType || parts[0]?.type || "audio/webm", failed);
      for (const t of stream.getAudioTracks())
        t.onended = () => {
          failed = true;
          stop();
        };
      r.start(1000);
      el("record").hidden = true;
      el("stop").hidden = false;
      el("stage").textContent = "Recording your voice…";
      el("stop").focus();
      const start = Date.now();
      status("Microphone on. Stop whenever you like.");
      timer = setInterval(() => {
        const sec = Math.floor((Date.now() - start) / 1000);
        el("stop").textContent =
          "Stop recording · " +
          Math.floor(sec / 60) +
          ":" +
          String(sec % 60).padStart(2, "0");
      }, 1000);
      stopTimer = setTimeout(stop, 120000);
    } catch {
      release();
      recorder = null;
      el("record").disabled = false;
      status(
        "Microphone unavailable. Check browser permission, try again or write below.",
      );
    } finally {
      pending = false;
    }
  };
  el("stop").onclick = stop;
  el("discard").onclick = () => {
    clearDraft();
    status("Take discarded. You can record another.");
    el("record").focus();
  };
  el("source-note").onclick = async () => {
    const original = file;
    if (!original) return;
    try {
      const bytes = await original.arrayBuffer();
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      if (original !== file) return;
      const note = {
        format: "family-source-note/1",
        kind: "oral-history",
        review: "unreviewed-recollection",
        prompt: card.title,
        captureEndedAt: new Date(original.lastModified).toISOString(),
        filename: original.name,
        mediaType: original.type,
        bytes: original.size,
        sha256: hash,
      };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([JSON.stringify(note, null, 2)], { type: "application/json" }),
      );
      a.download = "sunday-story.source.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      status(
        "Source note download requested. Keep it beside the original audio.",
      );
    } catch {
      status("Source note unavailable. You can still download your audio.");
    }
  };
  el("download").onclick = () => {
    unsaved = false;
    status("Download requested. Check your files before closing this tab.");
  };
  el("share").onclick = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file] });
      unsaved = false;
      status("Share sheet completed. Check the chosen destination.");
    } catch (e) {
      status(
        e.name === "AbortError"
          ? "Sharing cancelled. Your take is still here."
          : "Sharing unavailable. Download the audio instead.",
      );
    }
  };
  el("save-text").onclick = () => {
    const value = el("story-text").value.trim();
    if (!value) {
      status("Write a few lines first.");
      el("story-text").focus();
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([card.title + "\n\n" + value + "\n"], {
        type: "text/plain;charset=utf-8",
      }),
    );
    a.download = "sunday-story.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    textSaved = el("story-text").value;
    status("Written story download requested.");
  };
  let textSaved = "";
  window.addEventListener("beforeunload", (e) => {
    if (unsaved || recorder || el("story-text").value !== textSaved) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  window.addEventListener("pagehide", () => {
    generation++;
    stop();
    release();
    window.speechSynthesis?.cancel();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (pending) generation++;
      stop();
      el("record").disabled = !canRecord;
    }
  });
  if ("speechSynthesis" in window) {
    const synth = window.speechSynthesis;
    const voice = () =>
      synth.getVoices().find((v) => v.localService && v.lang.startsWith("en"));
    function refresh() {
      el("read").hidden = !voice();
    }
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    el("read").onclick = () => {
      const v = voice();
      if (!v || pending || recorder) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(card.title + " " + card.intro);
      u.voice = v;
      u.rate = 0.9;
      synth.speak(u);
    };
  }
}
