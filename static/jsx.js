/**
 * I thought I could beat the masters of minification, the authors of htm
 *
 * But I was wrong
 *
 * So very very wrong.
 */
import uuidv4 from "./uuid.js";

/**
 * @typedef VNode
 * @property {string} name
 * @property {{[_: string]: string}} attributes;
 * @property {(string|VNode)[]} children
 */

const SVG_NS = "http://www.w3.org/2000/svg",
  HTML_NS = "http://www.w3.org/1999/xhtml",
  parser = new DOMParser(),
  markerRegex =
    /__[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}__/g;

/**
 *
 * @param {VNode|string} vnode
 * @param {string|null} namespace
 * @returns {Node}
 */
function reifyVNode(vnode, namespace = HTML_NS) {
  if (typeof vnode === "string") return document.createTextNode(vnode);
  if (vnode.name === "svg") namespace = SVG_NS;

  const node = document.createElementNS(namespace, vnode.name);

  for (const [name, value] of Object.entries(vnode.attributes)) {
    node.setAttribute(name, value);
  }

  for (const childNode of vnode.children) {
    node.appendChild(
      reifyVNode(
        childNode,
        vnode.name === "foreignObject" ? HTML_NS : namespace
      )
    );
  }
  return node;
}

/**
 *
 * @param {Node} node
 * @returns {VNode|string}
 */
function toVNode(node, map) {
  const replace = (match) => (match in map ? map[match] : match);
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.replace(markerRegex, replace);
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    return {
      name: node.nodeName,
      attributes: Object.fromEntries(
        Array.from(/** @type {Element} */ (node).attributes, (attribute) => [
          attribute.name,
          attribute.value.replace(markerRegex, replace),
        ])
      ),
      children: Array.from(/** @type {Element} */ (node).children, (child) =>
        toVNode(child, map)
      ),
    };
  }
}

export default function jsx(strings, ...values) {
  const [firstString] = strings,
    map = Object.fromEntries(values.map((value) => [`__${uuidv4()}__`, value])),
    keys = Object.keys(map);
  let i,
    joiner = [firstString];

  for (i = 1; i <= Math.min(strings.length, values.length); i++) {
    joiner.push(keys[i - 1], strings[i]);
  }

  return reifyVNode(
    toVNode(
      parser.parseFromString(joiner.join(""), "application/xml")
        .documentElement,
      map
    )
  );
}
