class Tree {
  constructor() {
    this.root = null;
  }
  isEmpty() {
    if (this.root === null) {
      return true;
    } else {
      return false;
    }
  }
  fetchRootValue() {
    return this.root.value;
  }

  printTree(tree) {
    console.log(tree.value);
    if (tree.left) {
      this.printTree(tree.left);
    }
    if (tree.right) {
      this.printTree(tree.right);
    }
  }

  numberInTree(tree, value) {
    if (tree.value === value) {
      return true;
    }
    if (tree.right === undefined) {
      if (tree.left === undefined) {
        return false;
      } else {
        return this.numberInTree(tree.left, value);
      }
    }

    if (tree.left === undefined) {
      if (tree.right === undefined) {
        return false;
      } else {
        return this.numberInTree(tree.right, value);
      }
    }

    return (
      this.numberInTree(tree.left, value) ||
      this.numberInTree(tree.right, value)
    );
  }

  addNode(value) {
    if (this.isEmpty() === true) {
      this.root = new newNode(value);
      return "None";
    } else {
      let currentNode = this.root;
      let finished = false;
      while (!finished) {
        console.log("STARTING LOOP AT NODE", currentNode);
        if (value < currentNode.value) {
          console.log("BRANCHED LEFT");
          console.log("THE NODE LEFT TO WHERE WE ARE IS", currentNode.left);
          if (currentNode.left === undefined) {
            currentNode.left = new newNode(value);
            console.log("ADDED NODE", currentNode.left);
            finished = true;
            return currentNode.value;
          } else {
            currentNode = currentNode.left;
            console.log("NOW AT", currentNode);
          }
        } else {
          console.log("BRANCHED RIGHT");
          console.log("THE NODE RIGHT TO WHERE WE ARE IS", currentNode.right);
          if (currentNode.right === undefined) {
            currentNode.right = new newNode(value);
            console.log("ADDED NODE", currentNode.right);
            finished = true;
            return currentNode.value;
          } else {
            currentNode = currentNode.right;
            console.log("NOW AT", currentNode);
          }
        }
      }
    }
  }
}

class newNode {
  constructor(value) {
    this.value = value;
    this.left = undefined;
    this.right = undefined;
  }
}

const oak = new Tree();

console.log(oak.isEmpty());

for (let i = 5; i < 10; i += 2) {
  oak.addNode(i);
  oak.addNode(9 - i);
}

oak.printTree(oak.root);

for (let i = 0; i < 10; i++) {
  console.log(i, oak.numberInTree(oak.root, i));
}
