import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

const minimalSuggestions = [
  {
    title: "3D axis visualization (model airplane)",
    message:
      "Visualize pitch, yaw, and roll using a 3D model airplane. Render a simple airplane silhouette (SVG or CSS-3D) at the origin, with three labelled axes (X=pitch, Y=yaw, Z=roll). Animate the airplane cycling through each rotation in turn — rotate about X, pause, rotate about Y, pause, rotate about Z, pause — with a legend showing which axis is active. Label each axis and add a short caption explaining each degree of freedom.",
  },
  {
    title: "How a neural network works",
    message:
      'Animate how a simple feed-forward neural network processes an input. Show 3 layers (input 4 nodes, hidden 5 nodes, output 2 nodes) with connections whose thickness encodes weight magnitude. Animate activations pulsing forward from input -> hidden -> output in a loop, brightening each node as it fires. Label each layer and add a short caption ("Forward pass"). Use indigo for active signal, slate for quiescent.',
  },
  {
    title: "Quicksort visualization",
    message:
      'Visualize quicksort on an array of ~10 bars of varying heights. At each step highlight the pivot in amber, elements being compared in indigo, and swapped elements in emerald; fade sorted elements to slate. Auto-advance through the sort in a loop (~600ms per step) with a caption showing the current operation ("Partition around pivot = 47", "Swap", "Recurse left"). Show the array as SVG rects so heights read cleanly.',
  },
  {
    title: "Fourier: square wave from sines",
    message:
      'Visualize how a square wave is built from the sum of odd-harmonic sine waves. Show 3 rotating circles on the left (epicycles at frequencies 1, 3, 5 with amplitudes 1, 1/3, 1/5), the running sum traced as a point, and the resulting waveform scrolling to the right over time. Label each harmonic with its frequency and amplitude; add a legend and a title "Fourier series: square wave". Loop continuously.',
  },
];

export function useOpenGenUISuggestions() {
  useConfigureSuggestions({
    suggestions: minimalSuggestions,
    available: "always",
  });
}
