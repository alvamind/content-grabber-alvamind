
# 🔁 Simple retry-util 🚀

[![npm version](https://badge.fury.io/js/retry-util-alvamind.svg)](https://badge.fury.io/js/retry-util-alvamind)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Tests](https://img.shields.io/badge/tests-10%20passing-brightgreen)
[![npm downloads](https://img.shields.io/npm/dm/retry-util-alvamind)](https://www.npmjs.com/package/retry-util-alvamind)
[![GitHub stars](https://img.shields.io/github/stars/alvamind/retry-util-alvamind?style=social)](https://github.com/alvamind/retry-util-alvamind)
[![GitHub forks](https://img.shields.io/github/forks/alvamind/retry-util-alvamind?style=social)](https://github.com/alvamind/retry-util-alvamind)

**Your Reliable Companion for Handling Transient Failures in Asynchronous Operations.** 🛡️

A battle-tested and meticulously crafted utility library designed to provide a robust, flexible, and easy-to-use solution for retrying asynchronous operations. `retry-util-alvamind` comes with configurable exponential backoff, allowing your applications to gracefully recover from temporary hiccups, such as network glitches, server overload, or third-party API rate limits. It’s more than just a retry mechanism; it's a reliability powerhouse. ⚡

## ✨ Features and Benefits - Deep Dive

-   **Simplicity at Its Core:** The API is straightforward, requiring minimal setup. Start retrying operations in minutes with just a few lines of code. 🧰 No complex configurations or steep learning curves.
-   **Highly Configurable:** Tailor the retry behavior to perfectly match your needs with options for maximum retries, initial delay, exponential backoff factor, and maximum delay. You have full control over the retry strategy. ⚙️
-   **Exponential Backoff with Precision:** Implement exponential backoff effortlessly. This approach prevents hammering the server with retries in short intervals, reducing server load, and increasing the chance of success. 📈 The delay smartly grows with each failure, until max delay is reached.
-   **Intuitive Retry Callback:** Get detailed insights into every retry attempt with the `onRetry` callback. Use it for logging, monitoring, or executing custom logic to prepare the environment before a retry. 🔔 This is essential for debugging and maintaining control over the process.
-   **Handles a Wide Range of Errors:**  `retry-util-alvamind` doesn’t discriminate—it handles both standard JavaScript `Error` objects and custom error types. We make sure no error is left behind.  🚫🐛
-   **Light as a Feather:** Enjoy zero dependencies, making it easy to integrate into any project without adding unnecessary bulk. This keeps your project lean and fast. 💨
-   **TypeScript Ready:** Fully built with TypeScript and providing clear type definitions. Get the benefits of static typing, enabling more robust and maintainable code. ✅ Enjoy compile-time safety and excellent IDE support.
-   **Thoroughly Tested:** Confidence is built-in with our comprehensive test suite, which covers a wide array of scenarios to ensure your peace of mind and application stability. 💯 The library is rigorously tested, leaving no room for doubt.
-   **Bun Test Compatibility:** We utilize the blazingly fast Bun Test runner, integrating seamlessly into modern JavaScript workflows. 🐇 It’s not just tested; it’s *Bun Tested*.
-    **Async Functionality:** Designed specifically for async operations, the library fits in naturally with contemporary JavaScript practices, ensuring compatibility and ease of use with `async/await` patterns. ⚙️
-   **Error Propagation:**  When retries are exhausted, the original error (including its instance type) is thrown, not a generic error, simplifying error handling in your code. This ensures all error contexts are preserved. ⚠️

## 📦 Installation - Multiple Ways

```bash
npm install retry-util-alvamind
```

or with yarn:

```bash
yarn add retry-util-alvamind
```

or if you prefer pnpm:

```bash
pnpm add retry-util-alvamind
```

Choose your package manager and install the library quickly and smoothly.

## ⚙️ Detailed Usage Examples

### Basic Example with Default Settings

```typescript
import { RetryUtil, RetryConfigInterface } from 'retry-util-alvamind';

const fetchData = async () => {
    // Assume this fetch operation can fail
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const retryConfig: RetryConfigInterface = {
    maxRetries: 3,
    initialDelay: 200,
    factor: 1.5,
    maxDelay: 1500
};

RetryUtil.withRetry(fetchData, retryConfig)
    .then(data => console.log('Data fetched:', data))
    .catch(error => console.error('Failed to fetch data:', error));
```

### With the `onRetry` Callback for Logging

```typescript
import { RetryUtil, RetryConfigInterface } from 'retry-util-alvamind';

const processFile = async (filename: string) => {
    console.log(`Attempting to process file: ${filename}`);
    const random = Math.random();
      if (random < 0.5) {
        throw new Error(`Failed to process file: ${filename}`);
    }
    return `File ${filename} processed successfully!`;
};

const retryConfig: RetryConfigInterface = {
    maxRetries: 5,
    initialDelay: 100,
    factor: 2,
    maxDelay: 1000
};

const onRetry = (attempt: number, error: Error) => {
  console.warn(`Processing failed (attempt ${attempt}): ${error.message}. Retrying in ${retryConfig.initialDelay * Math.pow(retryConfig.factor, attempt-1)}ms...`);
};

RetryUtil.withRetry(() => processFile('my_data.txt'), retryConfig, onRetry)
    .then(result => console.log('Result:', result))
    .catch(error => console.error('Processing failed:', error));
```

### Handling Custom Error Types

```typescript
import { RetryUtil, RetryConfigInterface } from 'retry-util-alvamind';

class CustomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CustomError';
    }
}

const flakyOperation = async () => {
  const random = Math.random();
    if (random < 0.7) {
      throw new CustomError('Flaky operation failed!');
    }
  return 'Flaky operation completed.';
};

const retryConfig: RetryConfigInterface = {
    maxRetries: 2,
    initialDelay: 50,
    factor: 3,
    maxDelay: 500
};

RetryUtil.withRetry(flakyOperation, retryConfig)
    .then(result => console.log('Result:', result))
    .catch(error => {
        console.error('Operation failed with:', error);
        if (error instanceof CustomError) {
            console.log('Custom error was thrown:', error.name);
        }
    });
```

## 🧪 In-Depth Test Analysis

The library is rigorously tested using Bun Test, a modern and ultra-fast JavaScript test runner. Here’s a breakdown of the tests:

```
bun test v1.1.42 (50eec002)

test/retry.test.ts:
✓ should succeed on first attempt [1.00ms]
✓ should succeed after one retry [102.00ms]
✓ should fail after max retries [305.00ms]
✓ should respect maxDelay configuration [304.00ms]
✓ should call onRetry callback for each retry [303.00ms]
✓ should handle zero retries configuration [1.00ms]
✓ should handle async operations with varying delays [203.00ms]
✓ should apply exponential backoff [302.00ms]
✓ should handle non-Error throws [311.00ms]
✓ should preserve error instance type [303.00ms]

 10 pass
 0 fail
 15 expect() calls
Ran 10 tests across 1 files. [2.15s]
```

-   **`should succeed on first attempt`:**  Verifies that if the operation succeeds on the first try, no retries occur. 🥇
-   **`should succeed after one retry`:**  Ensures that the operation succeeds after a single retry attempt if the initial call fails. 🥈
-   **`should fail after max retries`:**  Confirms that the library throws the error if the operation fails after all allowed retries. 🥉
-   **`should respect maxDelay configuration`:**  Tests if the maximum delay is correctly respected in the retry logic, preventing delays beyond a certain limit. ⏱️
-   **`should call onRetry callback for each retry`:**  Verifies that the `onRetry` callback is invoked as expected for each retry attempt, allowing proper error logging and handling. 🔔
-   **`should handle zero retries configuration`:**  Tests the behavior when `maxRetries` is set to 0, ensuring the operation is executed only once without retries. 0️⃣
-   **`should handle async operations with varying delays`:** Confirms that the library works seamlessly with async operations that have different delay profiles. ⏳
-  **`should apply exponential backoff`:** This test confirms that the delay between retries grows exponentially as configured. 📈
-   **`should handle non-Error throws`:** Makes sure the library correctly captures and propagates non-Error throws, maintaining error context. ⚠️
-   **`should preserve error instance type`:**  Verifies that the library maintains the original type of the error when throwing it after all retries have failed. This is crucial for proper error handling. 🧰

## 🗺️ Detailed Roadmap - Looking Ahead

Here's what we're planning for the future of `retry-util-alvamind`:

-   [ ] **Jitter Implementation:**  Adding random jitter to the backoff delays to prevent synchronized retries and further reduce server load. This feature will be highly configurable. 🎲
-   [ ] **Circuit Breaker Pattern:**  Introduce a circuit breaker pattern to stop calling failing services for a period of time. This can help a service to recover faster and avoid cascading failures. ⚙️
-   [ ] **Retry Cancellation:** Implement a cancellation mechanism to allow you to stop an ongoing retry operation programmatically if needed. 🚫
-   [ ] **Enhanced Documentation:**  Expanding the current documentation with more in-depth examples, use cases, and best practices. 📚
-   [ ] **Customizable onRetry Limit:** Adding an option to limit the number of times `onRetry` is invoked for better control. 🔔
-   [ ] **Advanced Error Handling:** Investigate more sophisticated error handling mechanisms, such as custom error mapping and recovery strategies. 🧰
-   [ ] **Metrics Integration:**  Add hooks to expose metrics and insights about the retry behavior that you can monitor using systems like Prometheus or Grafana.📊
-    [ ] **Improved Testing with Mocking**: Improve test coverage by adding more sophisticated testing, such as more robust mocking strategies. 🧪
-   [ ] **Support for Abort Signals**: Add support for abort signals to further control the retry operations and cancel retries through a signal. 🚦

### Detailed Checklist:

-   [x] Initial version published.
-   [x] Basic retry functionality implemented.
-   [x] Exponential backoff included.
-   [x] `onRetry` callback available.
-   [x] Comprehensive tests added.
-   [ ] Jitter implementation is on the roadmap and actively being explored.
-   [ ] Circuit breaker design is under active consideration for integration.
-   [ ] Cancellation implementation is planned and in progress.
-   [ ] Enhanced documentation is continuously being updated.
-   [ ] Customizable onRetry Limit is being planned for implementation.
-   [ ] Advanced error handling and custom error mapping are under investigation.
-   [ ] Metrics integration is planned for implementation.
-   [ ] Improved testing with mocking is being actively worked on.
-    [ ] Support for Abort Signals will be implemented.

## 🤝 Contributing - Getting Involved

We highly appreciate any contribution to `retry-util-alvamind`! Here's how you can contribute:

1.  **Fork the Repository:** Start by forking the repository to your own GitHub account.
2.  **Create a New Branch:** Create a new branch specifically for your changes: `git checkout -b feature-or-fix`.
3.  **Implement Your Changes:** Add your desired features, enhancements, or bug fixes.
4.  **Write Comprehensive Tests:** Make sure to add tests to cover the changes you made.
5.  **Run All Tests:**  Ensure all tests are passing: `npm test` or `yarn test`.
6.  **Commit Your Changes:**  Commit your changes with a clear and descriptive message using Conventional Commits. Example: `git commit -m "feat: add jitter to backoff"`.
7.  **Push to Your Branch:** Push your branch to your fork: `git push origin feature-or-fix`.
8.  **Create a Pull Request:** Create a pull request from your branch to the main repository.

Please make sure to follow our code style and conventions. Also, add a clear explanation of what the PR is doing.

## 💖 Donation - Support the Development

If you find this library helpful, please consider supporting its development and maintenance. Here are a few ways you can contribute:

-   ⭐ **Star the Repository:** Give us a star on GitHub to show your support.
-   📢 **Share:** Share `retry-util-alvamind` with your friends, colleagues, and the community on social media or other platforms.
*   **GitHub Sponsors:** [Link to GitHub Sponsors](https://github.com/sponsors/alvamind)
*   **Buy us a coffee:** [Link to donation page](https://www.buymeacoffee.com/alvamind)

## 📜 License - Open Source

This project is open source and available under the [MIT License](LICENSE). Feel free to use, modify, and distribute this library as per the license terms.

## ⚠️ Disclaimer - Use at Your Own Risk

This library is provided "as is," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software. Please use it responsibly and at your own risk. 🙏

## 🧑‍💻 Author - Contact Info

[Alvamind](https://github.com/alvamind)

Please feel free to contact me via email at [alvaminddigital@gmail.com](mailto:alvaminddigital@gmail.com) for any questions, feedback, or collaboration opportunities.

**Thank you for exploring `retry-util-alvamind`! I hope it helps you build more reliable and robust applications. Happy coding! 🎉**
