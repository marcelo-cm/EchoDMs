"use client";

import supabase from "@/supabaseClient";
import "@radix-ui/themes/styles.css";
import {
  Text,
  Card,
  Flex,
  Avatar,
  Box,
  Heading,
  TextField,
  IconButton,
  Button,
  Table,
  AlertDialog,
  Dialog,
  Callout,
  DialogDescription,
} from "@radix-ui/themes";
import {
  InfoCircledIcon,
  LockClosedIcon,
  PaperPlaneIcon,
  PersonIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useState } from "react";
import "../globals.css";
import { Server } from "http";
import Image from "next/image";

const Dashboard = () => {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userServers, setUserServers] = useState<String[]>([]);
  const [serverUserMap, setServerUserMap] = useState<{
    [key: string]: string[];
  }>({});
  const [serverInfoDict, setServerInfoDict] = useState<{
    [key: string]: string[];
  }>({ key: ["value"] });
  const [userInfoDict, setUserInfoDict] = useState<{
    [user: string]: {
      name: string;
      echos_sent: number;
      user_oauth: string;
      proxy_password: string;
    };
  }>({
    placeholder: {
      name: "",
      echos_sent: 0,
      user_oauth: "",
      proxy_password: "",
    },
  });
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    password: "",
    name: "",
    user_oauth: "",
  });
  const [editUserForm, setEditUserForm] = useState<any>();
  const [editServerForm, setEditServerForm] = useState<any>();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session) {
      // console.log("checkUser: ", data.session.user.id);
      getUserServers(data.session.user.id);
    } else {
      router.push("/");
    }
  }

  useEffect(() => {
    if (allUsers.length > 0) {
      getUserInfo();
    }
  }, [allUsers]);

  useEffect(() => {
    if (userServers.length > 0) {
      getServerUsers();
      getServerInfo();
    }
  }, [userServers]);

  const getUserServers = async (user_id: string) => {
    // This function gets all the servers that the user is a member of by querying the server_users table with the user's id
    // It then sets the userServers state to an array of the server ids

    const { data, error } = await supabase
      .from("server_users")
      .select("server_id")
      .eq("user_id", user_id);

    // console.log("getUserServers: ", data, error);

    if (!error) {
      setUserServers(data.map((element) => element.server_id));
    } else {
      console.log(error);
    }
  };

  const getServerInfo = async () => {
    // This function gets the server name for each server that the user is a member of
    // It then sets the serverInfoDict state to a dictionary of server ids and server names

    const { data, error } = await supabase
      .from("servers")
      .select("id, server_name")
      .in("id", userServers);

    // console.log("getServerInfo: ", data, error);

    if (!error) {
      setServerInfoDict((prevState) => {
        return data.reduce(
          (acc, element) => {
            acc[element.id] = element.server_name;
            return acc;
          },
          { ...prevState }
        );
      });
    } else {
      console.log(error);
    }
  };

  const getUserInfo = async () => {
    const { data, error } = await supabase
      .from("server_users")
      .select(
        "user_id, user_name, user_slack_id, echos_sent, user_oauth, proxy_password"
      )
      .in("user_slack_id", allUsers);

    if (!error) {
      setUserInfoDict((prevState) => {
        return data.reduce(
          (acc, element) => {
            acc[element.user_slack_id] = {
              name: element.user_name,
              echos_sent: element.echos_sent,
              user_oauth: element.user_oauth,
              proxy_password: element.proxy_password,
            };
            return acc;
          },
          { ...prevState }
        );
      });
    } else {
      console.log(error.message);
    }
  };

  const getServerUsers = async () => {
    const { data, error } = await supabase
      .from("server_users")
      .select("user_slack_id, server_id")
      .in("server_id", userServers);

    // console.log("getServerUsers: ", data, error);

    if (!error) {
      mapServerUsers(data);
      setAllUsers(Array.from(new Set(data.map((item) => item.user_slack_id))));
    } else {
      console.log(error);
    }
  };

  const mapServerUsers = (
    data: {
      user_slack_id: string;
      server_id: string;
    }[]
  ) => {
    const mapping: { [key: string]: string[] } = data.reduce(
      (
        acc: { [key: string]: string[] },
        record: { server_id: string; user_slack_id: string }
      ) => {
        if (!acc[record.server_id]) {
          acc[record.server_id] = [];
        }
        acc[record.server_id].push(record.user_slack_id);

        return acc;
      },
      {}
    );

    setServerUserMap(mapping);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    }
  };

  const deleteUser = async (server: string, id: string) => {
    const { error } = await supabase
      .from("server_users")
      .delete()
      .eq("user_id", id)
      .eq("server_id", server)
      .single();
    if (!error) {
      setIsDeleteOpen(false);
    }
    if (error) {
      console.log(error.message);
    }
  };

  const addUser = async (server: string) => {
    // console.log(server);
    const { email, password, name, user_oauth } = addUserForm;

    if (!email || !password || !name) {
      console.error("Email, password or name missing!");
      return;
    }

    var { data: user, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    // console.log(user);

    let userId: string | null = user?.user?.id || null;

    // If there is an error signing up, grab the user id from the users table with the email
    if (!signUpError) {
      const { data: userData, error: insertUserError } = await supabase
        .from("users")
        .insert([{ email: email, password: password, id: userId, name: name }]);

      if (insertUserError) {
        console.log(
          "Problem inserting user to users table: ",
          insertUserError.message
        );
      }
    } else {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching existing user ID:", error);
        return;
      }

      if (data) {
        userId = data.id;
      }
    }

    if (!userId) {
      console.error("Unable to get or generate user ID");
      return;
    }

    const { data: serverUserData, error: insertServerError } = await supabase
      .from("server_users")
      .insert([
        {
          server_id: server,
          user_id: userId,
          user_name: name,
          user_oauth: user_oauth,
          echo_sent: 0,
        },
      ])
      .select("*");

    if (insertServerError) {
      console.log(
        "Problem inserting user to server_users table: ",
        insertServerError.message
      );
    }

    router.push("/dashboard");
  };

  const editUser = async (slack_id: string) => {
    const { user_name, user_oauth, proxy_password } = editUserForm || {};

    // Create an object to store only the properties that are not undefined.
    const updateData: { [key: string]: any } = {};
    if (user_name !== undefined) updateData.user_name = user_name;
    if (user_oauth !== undefined) updateData.user_oauth = user_oauth;
    if (proxy_password !== undefined)
      updateData.proxy_password = proxy_password;

    // Check if the updateData object is empty. If it's empty, there's nothing to update.
    if (Object.keys(updateData).length === 0) {
      console.log("No data to update.");
      return;
    }

    const { data, error } = await supabase
      .from("server_users")
      .update(updateData)
      .eq("user_slack_id", slack_id);

    if (!error) {
      setIsDeleteOpen(false);
    }
    if (error) {
      console.log(error.message);
    }

    getUserInfo();
  };

  const editServer = async (server_id: string) => {
    const { server_name } = editServerForm || {};

    // Create an object to store only the properties that are not undefined.
    const updateData: { [key: string]: any } = {};
    if (server_name !== undefined) updateData.server_name = server_name;

    // Check if the updateData object is empty. If it's empty, there's nothing to update.
    if (Object.keys(updateData).length === 0) {
      console.log("No data to update.");
      return;
    }

    const { data, error } = await supabase
      .from("servers")
      .update(updateData)
      .eq("id", server_id);

    if (!error) {
      setIsDeleteOpen(false);
    }
    if (error) {
      console.log(error.message);
    }

    getServerInfo();
  };

  const updateAddUserForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddUserForm((prevState) => {
      return { ...prevState, [e.target.name]: e.target.value };
    });
  };

  const updateEditUserForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUserForm((prevState: any) => {
      return { ...prevState, [e.target.name]: e.target.value };
    });
  };

  const updateEditServerForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditServerForm((prevState: any) => {
      return { ...prevState, [e.target.name]: e.target.value };
    });
  };

  // useEffect(() => {
  //   console.log("editUserForm: ", editUserForm);
  // }, [editUserForm]);

  // useEffect(() => {
  //   console.log("editServerForm: ", editServerForm);
  // }, [editServerForm]);

  const handleCopyClick = async () => {
    const textToCopy = JSON.stringify(
      {
        display_information: {
          name: "EchoDM",
          description: "Send mass personalized DMs",
          background_color: "#2c54c9",
        },
        features: {
          bot_user: {
            display_name: "EchoDM",
            always_online: true,
          },
          slash_commands: [
            {
              command: "/echodm",
              url: "https://echo-dms-58a404be386c.herokuapp.com/echodm",
              description: "testing",
              should_escape: true,
            },
            {
              command: "/echosignin",
              url: "https://echo-dms-58a404be386c.herokuapp.com/echosignin",
              description: "signing into platform",
              should_escape: true,
            },
            {
              command: "/echoblast",
              url: "https://echo-dms-58a404be386c.herokuapp.com/echoblast",
              description: "channel blast",
              should_escape: true,
            },
            {
              command: "/echoaddserver",
              url: "https://echo-dms-58a404be386c.herokuapp.com/echoaddserver",
              description: "add server to echo dms",
              should_escape: true,
            },
          ],
        },
        oauth_config: {
          redirect_urls: [
            "https://echo-xkiquet2o-marcelo-cm.vercel.app/dashboard",
          ],
          scopes: {
            user: [
              "channels:read",
              "chat:write",
              "groups:read",
              "groups:write",
              "links.embed:write",
              "links:read",
              "links:write",
              "users.profile:read",
              "users:read",
            ],
            bot: ["chat:write", "commands"],
          },
        },
        settings: {
          org_deploy_enabled: false,
          socket_mode_enabled: false,
          token_rotation_enabled: false,
        },
      },
      null,
      4
    ); // This formats the JSON with 4 spaces indentation for better readability

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopySuccess("Copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    } else {
      console.error("Browser does not support clipboard API");
    }
  };

  const [copySuccess, setCopySuccess] = useState("");

  return (
    <main className="flex min-h-screen w-[100dvw] bg-slate-200 flex-col items-center justify-between gap-8 py-24">
      {/* Founder Contact Card */}
      <Card variant="classic" size="2" className="w-full lg:w-[425px]">
        <Flex justify="between" align="center">
          <Flex gap="4" align="center">
            <Avatar size="4" radius="full" fallback="M" color="indigo" />
            <Box>
              <Text as="div" weight="bold">
                Marcelo Chaman Mallqui
              </Text>
              <Text as="div" color="gray">
                Founder
              </Text>
            </Box>
          </Flex>
          <a href="mailto:marcechaman@gmail.com">
            <Button>
              <Flex direction="row" align="center" gap="2">
                <Text>Contact</Text>
                <PaperPlaneIcon />
              </Flex>
            </Button>
          </a>
        </Flex>
      </Card>
      <div className="flex flex-col lg:flex-row w-full items-center lg:items-start justify-center gap-8 align-center">
        <div className="w-full lg:w-1/2">
          <Card variant="classic" size="3" className="min-w-[400px] w-full">
            <Heading mb="4" size="6">
              Servers & Users
            </Heading>
            <Box mt="2">
              <Flex direction="column" gap="4">
                {Object.keys(serverUserMap)?.map((server, key) => (
                  <Heading size="4" key={key}>
                    <Flex gap="2" align="center" justify="between">
                      <Flex gap="2" align="center">
                        <Avatar
                          fallback={
                            serverInfoDict[server]
                              ? serverInfoDict[server][0]
                              : ""
                          }
                        />
                        {serverInfoDict[server]}
                      </Flex>
                      <Flex direction="row" gap="2">
                        <Dialog.Root>
                          <Dialog.Trigger>
                            <Button
                              size="2"
                              variant="soft"
                              className="hidden lg:flex"
                            >
                              Edit Server
                            </Button>
                          </Dialog.Trigger>
                          <Dialog.Content style={{ maxWidth: 500 }}>
                            <Dialog.Title>
                              Edit {serverInfoDict[server]}
                            </Dialog.Title>
                            <Flex direction="column" gap="3">
                              <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                  Name
                                </Text>
                                <TextField.Input
                                  name="server_name"
                                  onChange={(e) => updateEditServerForm(e)}
                                  defaultValue={serverInfoDict[server]}
                                  placeholder="Enter your server name"
                                />
                              </label>
                            </Flex>
                            <Flex gap="3" mt="4" justify="end">
                              <Dialog.Close>
                                <Button variant="soft" color="gray">
                                  Cancel
                                </Button>
                              </Dialog.Close>
                              <Dialog.Close onClick={() => editServer(server)}>
                                <Button>Save</Button>
                              </Dialog.Close>
                            </Flex>
                          </Dialog.Content>
                        </Dialog.Root>
                        <Dialog.Root>
                          <Dialog.Trigger>
                            <Button size="2" className="hidden lg:flex">
                              Add User
                              <PlusIcon />
                            </Button>
                          </Dialog.Trigger>
                          <Dialog.Content style={{ maxWidth: 450 }}>
                            <Dialog.Title>Edit profile</Dialog.Title>
                            <DialogDescription mb="2">
                              Add a user to {serverInfoDict[server]}
                            </DialogDescription>
                            <Flex direction="column" gap="3">
                              <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                  Name
                                </Text>
                                <TextField.Input
                                  name="name"
                                  onChange={(e) => updateAddUserForm(e)}
                                  placeholder="Enter your full name"
                                />
                              </label>
                              <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                  Email
                                </Text>
                                <TextField.Input
                                  name="email"
                                  onChange={(e) => updateAddUserForm(e)}
                                  placeholder="Enter your email"
                                />
                              </label>
                              <label>
                                <Text as="div" size="2" mb="1" weight="bold">
                                  User OAuth Token
                                </Text>
                                <TextField.Input
                                  name="user_oauth"
                                  onChange={(e) => updateAddUserForm(e)}
                                  placeholder="User OAuth Token"
                                />
                              </label>
                            </Flex>
                            <Flex gap="3" mt="4" justify="end">
                              <Dialog.Close>
                                <Button variant="soft" color="gray">
                                  Cancel
                                </Button>
                              </Dialog.Close>
                              <Dialog.Close>
                                <Button onClick={() => addUser(server)}>
                                  Add User
                                </Button>
                              </Dialog.Close>
                            </Flex>
                          </Dialog.Content>
                        </Dialog.Root>
                      </Flex>
                    </Flex>
                    <Table.Root mb="4">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>
                            Echo DMs Sent
                          </Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell />
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {serverUserMap[server]?.map((user, key) => (
                          <Table.Row key={key}>
                            <Table.RowHeaderCell>
                              <Flex gap="2" align="center">
                                <Avatar
                                  size="2"
                                  radius="full"
                                  fallback={userInfoDict[user]?.name[0]}
                                  color="indigo"
                                />
                                {userInfoDict[user]?.name}
                              </Flex>
                            </Table.RowHeaderCell>
                            <Table.Cell>
                              <Flex gap="2" height="100%" align="center">
                                {userInfoDict[user]?.echos_sent}
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              <Flex gap="2" height="100%" align="center">
                                <Dialog.Root
                                  onOpenChange={() => setEditUserForm({})}
                                >
                                  <Dialog.Trigger>
                                    <Button size="2" variant="soft">
                                      Edit User
                                    </Button>
                                  </Dialog.Trigger>
                                  <Dialog.Content style={{ maxWidth: 500 }}>
                                    <Dialog.Title>Edit profile</Dialog.Title>
                                    <Flex direction="column" gap="3">
                                      <label>
                                        <Text
                                          as="div"
                                          size="2"
                                          mb="1"
                                          weight="bold"
                                        >
                                          Name
                                        </Text>
                                        <TextField.Input
                                          name="user_name"
                                          onChange={(e) =>
                                            updateEditUserForm(e)
                                          }
                                          defaultValue={
                                            userInfoDict[user]?.name
                                          }
                                          placeholder="Enter your full name"
                                        />
                                      </label>
                                      <label>
                                        <Text
                                          as="div"
                                          size="2"
                                          mb="1"
                                          weight="bold"
                                        >
                                          User OAuth Token
                                        </Text>
                                        <TextField.Input
                                          name="user_oauth"
                                          onChange={(e) =>
                                            updateEditUserForm(e)
                                          }
                                          defaultValue={
                                            userInfoDict[user]?.user_oauth
                                          }
                                          placeholder="Enter your User OAuth Token"
                                        />
                                      </label>
                                      <label>
                                        <Text
                                          as="div"
                                          size="2"
                                          mb="1"
                                          weight="bold"
                                        >
                                          Proxy Password <em>(Optional)</em>
                                        </Text>
                                        <TextField.Input
                                          name="proxy_password"
                                          onChange={(e) =>
                                            updateEditUserForm(e)
                                          }
                                          defaultValue={
                                            userInfoDict[user]?.proxy_password
                                          }
                                          placeholder="Enter your Proxy Password"
                                        />
                                      </label>
                                      <Box>
                                        <Callout.Root>
                                          <Callout.Icon>
                                            <InfoCircledIcon />
                                          </Callout.Icon>
                                          <Callout.Text>
                                            Proxy passwords allow others to send
                                            DMs on your behalf.
                                          </Callout.Text>
                                        </Callout.Root>
                                      </Box>
                                    </Flex>
                                    <Flex gap="3" mt="4" justify="end">
                                      <Dialog.Close>
                                        <Button variant="soft" color="gray">
                                          Cancel
                                        </Button>
                                      </Dialog.Close>
                                      <Dialog.Close
                                        onClick={() => editUser(user)}
                                      >
                                        <Button>Save</Button>
                                      </Dialog.Close>
                                    </Flex>
                                  </Dialog.Content>
                                </Dialog.Root>
                                <AlertDialog.Root>
                                  <AlertDialog.Trigger>
                                    <Button
                                      size="2"
                                      color="red"
                                      className="invisible lg:visible"
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialog.Trigger>
                                  <AlertDialog.Content
                                    style={{ maxWidth: 450 }}
                                  >
                                    <Flex direction="column">
                                      <AlertDialog.Title>
                                        Are you sure?
                                      </AlertDialog.Title>
                                      <AlertDialog.Description size="2">
                                        If you delete this user, they will have
                                        to sign in again to use this app.
                                      </AlertDialog.Description>
                                      <Flex gap="3" mt="4" justify="end">
                                        <AlertDialog.Cancel>
                                          <Button variant="soft" color="gray">
                                            Cancel
                                          </Button>
                                        </AlertDialog.Cancel>
                                        <AlertDialog.Action>
                                          <Button
                                            variant="solid"
                                            color="red"
                                            onClick={() =>
                                              deleteUser(server, user)
                                            }
                                          >
                                            Delete User
                                          </Button>
                                        </AlertDialog.Action>
                                      </Flex>
                                    </Flex>
                                  </AlertDialog.Content>
                                </AlertDialog.Root>
                              </Flex>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Heading>
                ))}
              </Flex>
            </Box>
          </Card>
        </div>
        <Flex direction="column" gap="4" className="w-full lg:w-[500px]">
          <Card variant="classic" size="3" className="w-full">
            <Flex direction="column" gap="4">
              <Heading size="6"> EchoDMs Helper Guider 🏄‍♂️ </Heading>
              <Text>
                1️⃣ To send a personal DM to each person in a channel, excluding
                a few <br />
                <b>
                  /echodm #channel @ExcludedPerson1 @ExcludedPerson2 || message
                </b>
                <br />
                <br />
                2️⃣ To send a personal DM to various people at once <br />
                <b>/echodm @Person1 @Person2 || message </b>
                <br />
                <br />
                If you include a channel name in your command request, then it
                will default to 1️⃣. Don't forget the "<b>||</b>" to seperate the
                components of your message, and remember, you can send to
                various channels at once too! If you have any questions shoot me
                an email marcechaman@gmail.com 😎
              </Text>
            </Flex>
          </Card>
          <Card variant="classic" size="3" className="w-full">
            <Flex direction="column" gap="4">
              <Heading size="6">1. How to Install EchoDMs</Heading>
              <Text>
                1. Visit{" "}
                <a
                  className="text-blue-500 underline hover:no-underline"
                  href="https://api.slack.com/"
                >
                  https://api.slack.com/
                </a>{" "}
                and click "Your Apps", then "Create New App".
              </Text>
              <Image
                src="/CREATENEWAPP.gif"
                alt="Gif to create new app."
                width="320"
                height="200"
                className="ring-2 ring-gray-200 rounded-md "
              />
              <Text>
                2. Select "From an app manifest", select a workspace, and copy
                and paste this text:{" "}
                <a
                  className="text-blue-500 underline hover:no-underline hover:cursor-pointer"
                  onClick={handleCopyClick}
                >
                  {copySuccess ? (
                    <p className="inline">{copySuccess}</p>
                  ) : (
                    "Click me to copy web manifest!"
                  )}
                </a>
              </Text>
              <Image
                src="/FROMANAPPMANIFEST.gif"
                alt="Gif to create new app."
                width="320"
                height="200"
                className="ring-2 ring-gray-200 rounded-md"
              />
              <Text>3. Press Create and you've completed stage 1!</Text>
              <Heading size="6">2. Adding Slack Workspace to EchoDMs</Heading>
              <Text>
                1. In the workspace you created the app in, simply sign in with{" "}
                <b>/echoaddserver email password</b>.
              </Text>
              <Image
                src="/echoaddservercommand.png"
                alt="Screenshot of /echoaddserver command."
                width="320"
                height="200"
                className="ring-2 ring-gray-200 rounded-md"
              />
              <Heading size="6">3. Signing In</Heading>
              <Text>
                1. Open your app at{" "}
                <a
                  className="text-blue-500 underline hover:no-underline"
                  href="https://api.slack.com/"
                >
                  https://api.slack.com/
                </a>{" "}
                and click <b>OAuth & Permissions</b>. Copy the{" "}
                <b>User OAuth Token</b>. If you need to install to get your User
                OAuth Token, please do so!
              </Text>
              <Image
                src="/useroauthsection.png"
                alt="Where to find User OAuth Token."
                width="320"
                height="200"
                className="ring-2 ring-gray-200 rounded-md"
              />
              <Text>
                2. In the workspace you created the app in, simply sign in with
                /echosignin email password UserOAuthToken. Example below:
              </Text>
              <Image
                src="/echosignincommand.png"
                alt="/echosignin command."
                width="320"
                height="200"
                className="ring-2 ring-gray-200 rounded-md"
              />
              <Text>
                3. Congrats! You're ready to reclaim hours of your life back!
              </Text>
            </Flex>
          </Card>
        </Flex>
      </div>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </main>
  );
};

export default Dashboard;
